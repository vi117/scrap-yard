import { ChunkCreateMethod, ChunkDeleteMethod, ChunkMethod, ChunkModifyMethod, ChunkMoveMethod, makeRPCError, makeRPCResult, RPCErrorBase } from "model";
import { Participant } from "./connection.ts";
import { ActiveDocumentObject, DocStore } from "./docStore.ts";
import {
  ChunkConflictError,
  InvalidChunkIdError,
  InvalidPositionError,
} from "model";
import { crypto } from "https://deno.land/std@0.137.0/crypto/mod.ts";
import { returnRequest } from "./rpc.ts";
import * as log from "std/log";

function makeChunkId(): string {
  return crypto.randomUUID();

}
export type ChunkCreateHistory = {
  type: "create";
  position: number;
};

export type ChunkModifyHistory = {
  type: "modify";
  chunkId: string;
}

export type ChunkRemoveHistory = {
  type: "remove";
  position: number;
};

export type ChunkMoveHistory = {
  type: "move";
  fromPosition: number;
  toPosition: number;
};

export type ChunkMethodHistory =
  ChunkCreateHistory |
  ChunkModifyHistory |
  ChunkRemoveHistory |
  ChunkMoveHistory;

interface ChunkMethodAction {
  action: (doc: ActiveDocumentObject) => ChunkMethodHistory;
  checkConflict: (m: ChunkMethodHistory) => boolean;
  trySolveConflict: (m: ChunkMethodHistory) => boolean;
}

class ChunkCreateAction implements ChunkMethodAction {
  params: ChunkCreateMethod["params"];

  constructor(m: ChunkCreateMethod) {
    this.params = m.params;
  }

  action(doc: ActiveDocumentObject): ChunkCreateHistory {
    if (this.params.position > doc.chunks.length || this.params.position < 0) {
      throw new InvalidPositionError(this.params.position);
    }
    if (
      this.params.chunkId && doc.chunks.find((c) => c.id === this.params.chunkId)
    ) {
      throw new InvalidChunkIdError(this.params.chunkId);
    }
    const chunk = {
      id: this.params.chunkId || makeChunkId(),
      ...this.params.chunkContent,
    };
    doc.chunks.splice(this.params.position, 0, chunk);
    return {
      type: "create",
      position: this.params.position,
    }
  }

  checkConflict(m: ChunkMethodHistory): boolean {
    //TODO(vi117): change `if` to `switch`.
    if (m.type === "create") {
      // If the positions are the same, 
      // it creates the chunk after the first one.
      return (m.position <= this.params.position);
    }
    else if (m.type === "remove") {
      return (m.position < this.params.position);
    }
    else if (m.type === "modify") {
      return false;
    }
    else if (m.type === "move") {
      return (m.fromPosition < this.params.position && m.toPosition >= this.params.position)
        || (m.fromPosition > this.params.position && m.toPosition < this.params.position);
    }
    else {
      log.error(`unknown history type: ${m}, unreachable`);
      throw new Error("unknown history type");
    }
  }

  trySolveConflict(m: ChunkMethodHistory): boolean {
    //TODO(vi117): change `if` to `switch`.
    if (m.type === "create") {
      this.params.position += 1;
      return true;
    }
    else if (m.type === "remove") {
      this.params.position -= 1;
      return true;
    }
    else if (m.type === "modify") {
      throw new Error("unreachable");
    }
    else if (m.type === "move") {
      if (m.fromPosition < this.params.position &&
        m.toPosition >= this.params.position) {
        this.params.position -= 1;
        return true;
      }
      else {
        this.params.position += 1;
        return true;
      }
    }
    else {
      log.error(`unknown history type: ${m}, unreachable`);
      throw new Error("unknown history type");
    }
  }
}

class ChunkDeleteAction implements ChunkMethodAction {
  params: ChunkDeleteMethod["params"];

  constructor(m: ChunkDeleteMethod) {
    this.params = m.params;
  }

  action(doc: ActiveDocumentObject): ChunkRemoveHistory {
    const chunkIndex = doc.chunks.findIndex((c) =>
      c.id === this.params.chunkId);
    if (chunkIndex < 0) {
      throw new InvalidChunkIdError(this.params.chunkId)
    }
    doc.chunks.splice(chunkIndex, 1);
    return {
      type: "remove",
      position: chunkIndex,
    }
  }

  checkConflict(_m: ChunkMethodHistory): boolean {
    return false;
  }

  trySolveConflict(_m: ChunkMethodHistory): boolean {
    return false;
  }
}

class ChunkModifyAction implements ChunkMethodAction {
  params: ChunkModifyMethod["params"];

  constructor(m: ChunkModifyMethod) {
    this.params = m.params;
  }

  action(doc: ActiveDocumentObject): ChunkModifyHistory {
    const chunkIndex = doc.chunks.findIndex((c) =>
      c.id === this.params.chunkId);
    if (chunkIndex < 0) {
      throw new InvalidChunkIdError(this.params.chunkId)
    }
    doc.chunks[chunkIndex] = {
      ...doc.chunks[chunkIndex],
      ...this.params.chunkContent,
    };
    return {
      type: "modify",
      chunkId: this.params.chunkId,
    }
  }

  checkConflict(m: ChunkMethodHistory): boolean {
    if (m.type === "modify") {
      return m.chunkId === this.params.chunkId;
    }
    return false;
  }

  trySolveConflict(_m: ChunkMethodHistory): boolean {
    return false;
  }
}

class ChunkMoveAction implements ChunkMethodAction {
  params: ChunkMoveMethod["params"];

  constructor(m: ChunkMoveMethod) {
    this.params = m.params;
  }

  action(doc: ActiveDocumentObject): ChunkMoveHistory {
    const chunkIndex = doc.chunks.findIndex((c) =>
      c.id === this.params.chunkId);
    if (chunkIndex < 0) {
      throw new InvalidChunkIdError(this.params.chunkId)
    }

    const chunk = doc.chunks[chunkIndex];
    doc.chunks.splice(chunkIndex, 1);
    doc.chunks.splice(this.params.position, 0, chunk);

    return {
      type: "move",
      fromPosition: chunkIndex,
      toPosition: this.params.position,
    }
  }

  checkConflict(m: ChunkMethodHistory): boolean {
    //TODO(vi117): conflict check implementation
    return true;
  }

  trySolveConflict(_m: ChunkMethodHistory): boolean {
    return false;
  }
}

const chunkMethodActions: { [key: string]: (m: ChunkMethod) => ChunkMethodAction } = {
  "chunk.create": (m) => new ChunkCreateAction(m as ChunkCreateMethod),
  "chunk.delete": (m) => new ChunkDeleteAction(m as ChunkDeleteMethod),
  "chunk.modify": (m) => new ChunkModifyAction(m as ChunkModifyMethod),
  "chunk.move": (m) => new ChunkMoveAction(m as ChunkMoveMethod),
};

function getAction(m: ChunkMethod): ChunkMethodAction {
  const action = chunkMethodActions[m.method];
  if (!action) {
    log.error(`unknown chunk method: ${m.method}, unreachable`);
    throw new Error(`unknown chunk method type: ${m.method}`);
  }
  return action(m);
}

export async function handleChunkMethod(
  conn: Participant,
  p: ChunkMethod,
): Promise<void> {
  const docPath = p.params.docPath;
  const updateAt = p.params.docUpdatedAt;
  const doc = await DocStore.open(conn, docPath);
  const action = getAction(p);
  //TODO(vi117): permission check

  if (updateAt < doc.updatedAt) {
    //TODO(vi117): find with binary search solution
    const lastSeenIndex = doc.history.findIndex(
      (m) => m.time === updateAt);
    if (lastSeenIndex < 0) {
      returnRequest(conn, makeRPCError(p.id,
        new ChunkConflictError(doc.chunks, doc.updatedAt)));
      return;
    }
    for (let i = lastSeenIndex + 1; i < doc.history.length; i++) {
      const m = doc.history[i];
      if (action.checkConflict(m.method)) {
        if (!action.trySolveConflict(m.method)) {
          returnRequest(conn, makeRPCError(p.id,
            new ChunkConflictError(doc.chunks, doc.updatedAt)));
          return;
        }
      }
    }
  }

  try {
    const hist = action.action(doc);
    doc.updateDocHistory(hist);
    doc.broadcastMethod(p, doc.updatedAt, conn);
  }
  catch (e) {
    if (e instanceof RPCErrorBase) {
      returnRequest(conn, makeRPCError(p.id, e));
    }
  }
}
import { ChunkMethod, makeRPCError, makeRPCResult, RPCResponse } from "model";
import { Participant } from "./connection.ts";
import { DocStore } from "./docStore.ts";
import {
  ChunkConflictError,
  InvalidChunkIdError,
  InvalidPositionError,
} from "model";
import { crypto } from "https://deno.land/std@0.137.0/crypto/mod.ts";

function makeChunkId(): string {
  return crypto.randomUUID();
}

export async function handleChunkMethod(
  conn: Participant,
  p: ChunkMethod,
): Promise<RPCResponse> {
  const docPath = p.params.docPath;
  const updateAt = p.params.docUpdatedAt;
  switch (p.method) {
    case "chunk.create": {
      const doc = await DocStore.open(conn, docPath);
      //is params.doc stale?
      if (doc.updatedAt > updateAt) {
        // if so, reject with error
        return makeRPCError(
          p.id,
          new ChunkConflictError(doc.chunks, doc.updatedAt),
        );
      }
      const chunk = {
        id: p.params.chunkId || makeChunkId(),
        ...p.params.chunkContent,
      };
      if (p.params.position > doc.chunks.length || p.params.position < 0) {
        return makeRPCError(p.id, new InvalidPositionError(p.params.position));
      }
      if (
        p.params.chunkId && doc.chunks.find((c) => c.id === p.params.chunkId)
      ) {
        return makeRPCError(p.id, new InvalidChunkIdError(p.params.chunkId));
      }
      doc.chunks.splice(p.params.position, 0, chunk);
      doc.updateDocHistory(p);
      doc.broadcastMethod(p, doc.updatedAt, conn);
      return makeRPCResult(p.id, { chunkId: chunk.id });
    }
    case "chunk.delete": {
      const doc = await DocStore.open(conn, docPath);
      const chunkIndex = doc.chunks.findIndex((c) => c.id === p.params.chunkId);
      if (chunkIndex < 0) {
        return makeRPCError(p.id, new InvalidChunkIdError(p.params.chunkId));
      }
      doc.chunks.splice(chunkIndex, 1);
      doc.updateDocHistory(p);
      doc.broadcastMethod(p, doc.updatedAt, conn);
      return makeRPCResult(p.id, {
        chunkId: p.params.chunkId,
      });
    }
    case "chunk.modify": {
      const doc = await DocStore.open(conn, docPath);
      const chunkIndex = doc.chunks.findIndex((c) => c.id === p.params.chunkId);
      if (chunkIndex < 0) {
        return makeRPCError(p.id, new InvalidChunkIdError(p.params.chunkId));
      }
      doc.chunks[chunkIndex] = {
        ...doc.chunks[chunkIndex],
        ...p.params.chunkContent,
      };
      doc.updateDocHistory(p);
      doc.broadcastMethod(p, doc.updatedAt, conn);
      return makeRPCResult(p.id, {
        chunkId: p.params.chunkId,
      });
    }
  }
  throw new Error("Not implemented");
}

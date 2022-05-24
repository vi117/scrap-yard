import {
    ChunkCreateMethod,
    ChunkCreateNotificationParam,
    ChunkDeleteMethod,
    ChunkDeleteNotificationParam,
    ChunkMethod,
    ChunkModifyMethod,
    ChunkModifyNotificationParam,
    ChunkMoveMethod,
    ChunkMoveNotificationParam,
    makeRPCError,
    makeRPCResult,
} from "model";
import { Participant } from "./connection.ts";
import { ActiveDocumentObject, DocStore } from "./docStore.ts";
import {
    ChunkConflictError,
    InvalidChunkIdError,
    InvalidPositionError,
    PermissionDeniedError,
    RPCErrorBase,
} from "model";
import { crypto } from "std/crypto";
import * as log from "std/log";

function makeChunkId(): string {
    return crypto.randomUUID();
}
export type ChunkCreateHistory = ChunkCreateNotificationParam;

export type ChunkModifyHistory = ChunkModifyNotificationParam;

export type ChunkRemoveHistory = {
    position: number;
} & ChunkDeleteNotificationParam;

export type ChunkMoveHistory = {
    fromPosition: number;
    toPosition: number;
} & ChunkMoveNotificationParam;

export type ChunkMethodHistory =
    | ChunkCreateHistory
    | ChunkModifyHistory
    | ChunkRemoveHistory
    | ChunkMoveHistory;

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
        if (
            this.params.position > doc.chunks.length || this.params.position < 0
        ) {
            throw new InvalidPositionError(this.params.position);
        }
        if (
            this.params.chunkId &&
            doc.chunks.find((c) => c.id === this.params.chunkId)
        ) {
            throw new InvalidChunkIdError(this.params.chunkId);
        }
        const chunk = {
            id: this.params.chunkId || makeChunkId(),
            ...this.params.chunkContent,
        };
        doc.chunks.splice(this.params.position, 0, chunk);
        return {
            method: "chunk.create",
            chunkContent: this.params.chunkContent,
            position: this.params.position,
            chunkId: chunk.id,
        };
    }

    checkConflict(m: ChunkMethodHistory): boolean {
        //TODO(vi117): change `if` to `switch`.
        const type = m.method;
        if (type === "chunk.create") {
            // If the positions are the same,
            // it creates the chunk after the first one.
            return (m.position <= this.params.position);
        } else if (type === "chunk.delete") {
            return (m.position < this.params.position);
        } else if (type === "chunk.modify") {
            return false;
        } else if (type === "chunk.move") {
            return (m.fromPosition < this.params.position &&
                m.toPosition >= this.params.position) ||
                (m.fromPosition > this.params.position &&
                    m.toPosition < this.params.position);
        } else {
            const _: never = type; // exhaustive check
            log.error(`unknown history type: ${m}, unreachable`);
            throw new Error("unknown history type");
        }
    }

    trySolveConflict(m: ChunkMethodHistory): boolean {
        //TODO(vi117): change `if` to `switch`.
        const type = m.method;
        if (type === "chunk.create") {
            this.params.position += 1;
            return true;
        } else if (type === "chunk.delete") {
            this.params.position -= 1;
            return true;
        } else if (type === "chunk.modify") {
            throw new Error("unreachable");
        } else if (type === "chunk.move") {
            if (
                m.fromPosition < this.params.position &&
                m.toPosition >= this.params.position
            ) {
                this.params.position -= 1;
                return true;
            } else {
                this.params.position += 1;
                return true;
            }
        } else {
            const _: never = type; // exhaustive check
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
            c.id === this.params.chunkId
        );
        if (chunkIndex < 0) {
            throw new InvalidChunkIdError(this.params.chunkId);
        }
        doc.chunks.splice(chunkIndex, 1);
        return {
            method: "chunk.delete",
            position: chunkIndex,
            chunkId: this.params.chunkId,
        };
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
            c.id === this.params.chunkId
        );
        if (chunkIndex < 0) {
            throw new InvalidChunkIdError(this.params.chunkId);
        }
        doc.chunks[chunkIndex] = {
            ...doc.chunks[chunkIndex],
            ...this.params.chunkContent,
        };
        return {
            method: "chunk.modify",
            chunkContent: doc.chunks[chunkIndex],
            chunkId: this.params.chunkId,
        };
    }

    checkConflict(m: ChunkMethodHistory): boolean {
        if (m.method === "chunk.modify") {
            if (m.chunkId === this.params.chunkId) {
                return true;
            }
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
            c.id === this.params.chunkId
        );
        if (chunkIndex < 0) {
            throw new InvalidChunkIdError(this.params.chunkId);
        }

        const chunk = doc.chunks[chunkIndex];
        doc.chunks.splice(chunkIndex, 1);
        doc.chunks.splice(this.params.position, 0, chunk);

        return {
            method: "chunk.move",
            position: this.params.position,
            fromPosition: chunkIndex,
            toPosition: this.params.position,
            chunkId: this.params.chunkId,
        };
    }

    checkConflict(_m: ChunkMethodHistory): boolean {
        //TODO(vi117): conflict check implementation
        return true;
    }

    trySolveConflict(_m: ChunkMethodHistory): boolean {
        return false;
    }
}

const chunkMethodActions: {
    [key: string]: (m: ChunkMethod) => ChunkMethodAction;
} = {
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
    const docPath = conn.user.joinPath(p.params.docPath);
    const updateAt = p.params.docUpdatedAt;
    const doc = await DocStore.open(conn, docPath);
    const action = getAction(p);
    if (!conn.user.canWrite(docPath)) {
        conn.responseWith(
            makeRPCError(p.id, new PermissionDeniedError(p.params.docPath)),
        );
        return;
    }

    if (updateAt < doc.updatedAt) {
        //TODO(vi117): find with binary search solution
        const lastSeenIndex = doc.history.findIndex(
            (m) => m.time === updateAt,
        );
        if (lastSeenIndex < 0) {
            conn.responseWith(
                makeRPCError(
                    p.id,
                    new ChunkConflictError(doc.chunks, doc.updatedAt),
                ),
            );
            return;
        }
        for (let i = lastSeenIndex + 1; i < doc.history.length; i++) {
            const m = doc.history[i];
            if (action.checkConflict(m.method)) {
                if (!action.trySolveConflict(m.method)) {
                    conn.responseWith(
                        makeRPCError(
                            p.id,
                            new ChunkConflictError(doc.chunks, doc.updatedAt),
                        ),
                    );
                    return;
                }
            }
        }
    }

    try {
        const hist = action.action(doc);
        doc.updateDocHistory(hist);
        doc.broadcastChunkMethod(hist, doc.updatedAt, conn);
        conn.responseWith(
            makeRPCResult(p.id, {
                chunkId: hist.chunkId,
                updatedAt: doc.updatedAt,
                seq: doc.seq,
            }),
        );
        await doc.save();
        return;
    } catch (e) {
        if (e instanceof RPCErrorBase) {
            conn.responseWith(makeRPCError(p.id, e));
            return;
        } else throw e;
    }
}

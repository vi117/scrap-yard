import { ChunkCreateHistory, handleChunkMethod } from "./chunk.ts";
import { assert, assertEquals } from "std/assert";
import { stub } from "std/mock";
import { ActiveDocumentObject, DocStore } from "./docStore.ts";
import * as RPC from "model";
import { MockUser } from "./mockuser.ts";
import { MemoryDocReadWriter } from "../document/doc.ts";

const chunkCreateMethodTemplate: RPC.ChunkMethod = {
    method: "chunk.create",
    params: {
        docPath: "docPath",
        docUpdatedAt: 0,
        chunkContent: {
            type: "text",
            content: "content",
        },
        position: 0,
        chunkId: "chunkId",
    },
    jsonrpc: "2.0",
    id: 1,
};
const chunkDeleteMethodTemplate: RPC.ChunkMethod = {
    method: "chunk.delete",
    params: {
        docPath: "docPath",
        docUpdatedAt: 0,
        chunkId: "chunkId1",
    },
    jsonrpc: "2.0",
    id: 2,
};
const chunkUpdateMethodTemplate: RPC.ChunkMethod = {
    method: "chunk.modify",
    params: {
        docPath: "docPath",
        docUpdatedAt: 0,
        chunkContent: {
            type: "text",
            content: "content3",
        },
        chunkId: "chunkId1",
    },
    jsonrpc: "2.0",
    id: 3,
};

Deno.test({
    name: "basic chunk operation",
    fn: async (t) => {
        const conn = new MockUser("connId");
        const docObj = new ActiveDocumentObject(
            "docPath",
            10,
            MemoryDocReadWriter,
        );
        await MemoryDocReadWriter.save("docPath", {
            chunks: [],
            tags: [],
            version: 1,
        });
        const docStore = stub(DocStore, "open", () => {
            return docObj;
        });
        const chunks: RPC.Chunk[] = [{
            id: "chunkId1",
            type: "text",
            content: "content",
        }, {
            id: "chunkId2",
            type: "text",
            content: "content2",
        }];
        try {
            docObj.chunks = [...chunks];
            await t.step("create chunk", async () => {
                await handleChunkMethod(conn, {
                    ...chunkCreateMethodTemplate,
                    params: {
                        ...chunkCreateMethodTemplate.params,
                        docUpdatedAt: docObj.updatedAt,
                    },
                });
                const result = conn.popObject();
                const expectedResult: RPC.ChunkCreateResult = {
                    chunkId: "chunkId",
                    updatedAt: docObj.updatedAt,
                    seq: 1,
                };
                assertEquals(result, {
                    jsonrpc: "2.0",
                    id: 1,
                    result: expectedResult,
                });
                assertEquals(docObj.chunks, [{
                    id: "chunkId",
                    type: "text",
                    content: "content",
                }, ...chunks]);
            });
            docObj.chunks = [...chunks];
            await t.step("delete chunk", async () => {
                await handleChunkMethod(conn, {
                    ...chunkDeleteMethodTemplate,
                    params: {
                        ...chunkDeleteMethodTemplate.params,
                        docUpdatedAt: docObj.updatedAt,
                    },
                });
                const result = conn.popObject();
                assertEquals(result, {
                    jsonrpc: "2.0",
                    id: 2,
                    result: {
                        chunkId: "chunkId1",
                        updatedAt: docObj.updatedAt,
                        seq: 2,
                    },
                });
                assertEquals(docObj.chunks, [
                    chunks[1],
                ]);
            });
            docObj.chunks = [...chunks];
            await t.step("modify chunk", async () => {
                await handleChunkMethod(conn, {
                    ...chunkUpdateMethodTemplate,
                    params: {
                        ...chunkUpdateMethodTemplate.params,
                        docUpdatedAt: docObj.updatedAt,
                    },
                });
                const result = conn.popObject();
                assertEquals(result, {
                    jsonrpc: "2.0",
                    id: 3,
                    result: {
                        chunkId: "chunkId1",
                        updatedAt: docObj.updatedAt,
                        seq: 3,
                    },
                });
                assertEquals(docObj.chunks, [
                    { ...chunks[0], content: "content3" },
                    chunks[1],
                ]);
            });
            docObj.chunks = [...chunks];
            await t.step("move chunk", async () => {
                await handleChunkMethod(conn, {
                    method: "chunk.move",
                    params: {
                        docPath: "docPath",
                        docUpdatedAt: docObj.updatedAt,
                        chunkId: "chunkId1",
                        position: 1,
                    },
                    jsonrpc: "2.0",
                    id: 4,
                });
                const result = conn.popObject();
                assertEquals(result, {
                    jsonrpc: "2.0",
                    id: 4,
                    result: {
                        chunkId: "chunkId1",
                        updatedAt: docObj.updatedAt,
                        seq: 4,
                    },
                });
                assertEquals(docObj.chunks, [
                    chunks[1],
                    chunks[0],
                ]);
            });
            docObj.chunks = [...chunks];
            await t.step("invalid chunk operation", async () => {
                await handleChunkMethod(conn, {
                    method: "chunk.create",
                    params: {
                        docPath: "docPath",
                        docUpdatedAt: docObj.updatedAt,
                        chunkContent: {
                            type: "text",
                            content: "content",
                        },
                        position: -1,
                        chunkId: "chunkId",
                    },
                    jsonrpc: "2.0",
                    id: 1,
                });
                const result = conn.popObject();
                assertEquals(
                    result.error?.code,
                    RPC.RPCErrorCode.InvalidPosition,
                );
                assertEquals(docObj.chunks, chunks);
            });
        } finally {
            docStore.restore();
            MemoryDocReadWriter.clear();
        }
    },
});

Deno.test({
    name: "test chunk notification operation",
    fn: async () => {
        const connAlice = new MockUser("connIdAlice");
        const connBob = new MockUser("connIdBob");

        const docObj = new ActiveDocumentObject(
            "docPath",
            10,
            MemoryDocReadWriter,
        );
        MemoryDocReadWriter.save("docPath", {
            chunks: [],
            tags: [],
            version: 1,
        });
        docObj.join(connAlice);
        docObj.join(connBob);
        docObj.updatedAt = 1000;
        const docStore = stub(DocStore, "open", () => {
            return docObj;
        });
        try {
            await handleChunkMethod(connAlice, {
                method: "chunk.create",
                params: {
                    docPath: "docPath",
                    docUpdatedAt: 2000,
                    chunkContent: {
                        type: "text",
                        content: "content",
                    },
                    position: 0,
                    chunkId: "chunkId",
                },
                jsonrpc: "2.0",
                id: 1,
            });
            const result = connAlice.popObject();
            const m: ChunkCreateHistory = {
                chunkId: "chunkId",
                chunkContent: {
                    type: "text",
                    content: "content",
                },
                position: 0,
                method: "chunk.create",
            };
            const expected: RPC.ChunkNotification = {
                jsonrpc: "2.0",
                method: "chunk.update",
                params: {
                    docPath: "docPath",
                    seq: 1,
                    method: m,
                    updatedAt: docObj.updatedAt,
                },
            };
            const bobs = connBob.popObject();
            assertEquals(bobs, expected);
            assertEquals(result, {
                jsonrpc: "2.0",
                id: 1,
                result: {
                    chunkId: "chunkId",
                    updatedAt: docObj.updatedAt,
                    seq: 1,
                },
            });
        } finally {
            docStore.restore();
            MemoryDocReadWriter.clear();
        }
    },
});

Deno.test({
    name: "test chunk conflict",
    fn: async () => {
        const connAlice = new MockUser("connIdAlice");
        const connBob = new MockUser("connIdBob");

        const docObj = new ActiveDocumentObject(
            "docPath",
            10,
            MemoryDocReadWriter,
        );

        await MemoryDocReadWriter.save("docPath", {
            chunks: [{
                id: "chunkId",
                type: "text",
                content: "content",
            }],
            tags: [],
            version: 1,
        });
        docObj.join(connAlice);
        docObj.join(connBob);
        await docObj.open();
        docObj.updatedAt = 1000;
        const docStore = stub(DocStore, "open", () => {
            return docObj;
        });
        try {
            await handleChunkMethod(connAlice, {
                ...chunkUpdateMethodTemplate,
                params: {
                    ...chunkUpdateMethodTemplate.params,
                    docUpdatedAt: 2000,
                    chunkContent: {
                        type: "text",
                        content: "content2",
                    },
                    chunkId: "chunkId",
                },
            });
            const result = connAlice.popObject();
            assert("result" in result);
            connBob.popObject();
            await handleChunkMethod(connBob, {
                ...chunkUpdateMethodTemplate,
                params: {
                    ...chunkUpdateMethodTemplate.params,
                    docUpdatedAt: 2000,
                    chunkContent: {
                        type: "text",
                        content: "content3",
                    },
                    chunkId: "chunkId",
                },
            });
            const result2 = connBob.popObject();
            assertEquals(result2, {
                jsonrpc: "2.0",
                id: 3,
                error: {
                    code: RPC.RPCErrorCode.ChunkConflict,
                    message: "conflict",
                    data: {
                        chunks: [{
                            content: "content2",
                            id: "chunkId",
                            type: "text",
                        }],
                        updatedAt: docObj.updatedAt,
                    },
                },
            });
            assertEquals(connAlice.messageBuffer.length, 0);
        } finally {
            docStore.restore();
            MemoryDocReadWriter.clear();
        }
    },
});

Deno.test({
    name: "test chunk conflict resolve with history",
    fn: async () => {
        const connAlice = new MockUser("connIdAlice");
        const connBob = new MockUser("connIdBob");

        const docObj = new ActiveDocumentObject(
            "docPath",
            10,
            MemoryDocReadWriter,
        );

        await MemoryDocReadWriter.save("docPath", {
            chunks: [{
                id: "chunkId",
                type: "text",
                content: "content",
            }],
            tags: [],
            version: 1,
        });
        docObj.join(connAlice);
        docObj.join(connBob);
        await docObj.open();
        docObj.updatedAt = 1000;
        const docStore = stub(DocStore, "open", () => {
            return docObj;
        });
        try {
            const create = async () => {
                await handleChunkMethod(connAlice, {
                    ...chunkUpdateMethodTemplate,
                    params: {
                        ...chunkUpdateMethodTemplate.params,
                        docUpdatedAt: docObj.updatedAt,
                        chunkContent: {
                            type: "text",
                            content: "content2",
                        },
                        chunkId: "chunkId",
                    },
                });
                const result = connAlice.popObject();
                assert("result" in result);
                connBob.popObject();
                return docObj.updatedAt;
            };
            const c = await create();
            await new Promise((r) =>
                setTimeout(() => {
                    r(undefined);
                }, 1)
            );
            await create();
            await handleChunkMethod(connBob, {
                ...chunkCreateMethodTemplate,
                params: {
                    ...chunkCreateMethodTemplate.params,
                    docUpdatedAt: c,
                    chunkId: "chunkId2",
                },
            });
            const result2 = connBob.popObject();
            assert("result" in result2);
            assertEquals(docObj.chunks.map((c) => c.id), [
                "chunkId2",
                "chunkId",
            ]);
        } finally {
            docStore.restore();
            MemoryDocReadWriter.clear();
        }
    },
});

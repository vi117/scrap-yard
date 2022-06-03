import { handleDocumentMethod, handleTagMethod } from "./doc.ts";
import { assertEquals } from "std/assert";
import { Stub, stub } from "std/mock";
import { ActiveDocumentObject, DocStore } from "./docStore.ts";
import * as RPC from "model";
import { MockUser } from "./mockuser.ts";
import { MemoryDocReadWriter } from "../document/doc.ts";

const docPath = "doc1.json";

let docStoreStub: Stub<typeof DocStore, [], ActiveDocumentObject> | null = null;

function beforeEach() {
    const conn = new MockUser("connId");
    MemoryDocReadWriter.save(docPath, {
        chunks: [],
        tags: [],
        version: 1,
    });
    const docObj = new ActiveDocumentObject(
        docPath,
        10,
        MemoryDocReadWriter,
    );
    docStoreStub = stub(DocStore, "open", () => {
        return docObj;
    });
    return { conn, docObj };
}
function afterEach() {
    MemoryDocReadWriter.clear();
    if (docStoreStub) {
        docStoreStub.restore();
        docStoreStub = null;
    }
}

Deno.test({
    name: "handleDocumentMethod",
    fn: async () => {
        const { conn, docObj } = beforeEach();
        try {
            const method: RPC.DocumentMethod = {
                jsonrpc: "2.0",
                id: 1,
                method: "document.open",
                params: { docPath },
            };
            await handleDocumentMethod(conn, method);
            const result = conn.popObject();
            assertEquals(result, {
                jsonrpc: "2.0",
                id: 1,
                result: {
                    doc: {
                        chunks: [],
                        updatedAt: docObj.updatedAt,
                        seq: 0,
                        tags: [],
                        tagsUpdatedAt: docObj.tagsUpdatedAt,
                        docPath,
                    },
                    writable: true,
                },
            });
        } finally {
            afterEach();
        }
    },
});

Deno.test({
    name: "handleTagMethod",
    fn: async (t) => {
        const { conn, docObj } = beforeEach();
        try {
            await t.step("setTag", async () => {
                const method: RPC.DocumentTagSetMethod = {
                    jsonrpc: "2.0",
                    id: 1,
                    method: "document.setTag",
                    params: {
                        docPath,
                        tags: ["tag1", "tag2"],
                        updatedAt: docObj.tagsUpdatedAt,
                    },
                };
                await handleTagMethod(conn, method);
                const result = conn.popObject();
                assertEquals(result, {
                    jsonrpc: "2.0",
                    id: 1,
                    result: {
                        updatedAt: docObj.tagsUpdatedAt,
                    },
                });
            });
            await t.step("getTag", async () => {
                const method: RPC.DocumentTagGetMethod = {
                    jsonrpc: "2.0",
                    id: 1,
                    method: "document.getTag",
                    params: {
                        docPath,
                    },
                };
                await handleTagMethod(conn, method);
                const result = conn.popObject();
                assertEquals(result, {
                    jsonrpc: "2.0",
                    id: 1,
                    result: {
                        tags: ["tag1", "tag2"],
                        updatedAt: docObj.tagsUpdatedAt,
                    },
                });
            });
            await t.step("conflict", async () => {
                const method: RPC.DocumentTagSetMethod = {
                    jsonrpc: "2.0",
                    id: 1,
                    method: "document.setTag",
                    params: {
                        docPath,
                        tags: ["tag1", "tag2"],
                        updatedAt: docObj.tagsUpdatedAt - 500,
                    },
                };
                await handleTagMethod(conn, method);
                const result = conn.popObject();
                assertEquals(result, {
                    jsonrpc: "2.0",
                    id: 1,
                    error: {
                        code: RPC.RPCErrorCode.TagsConflict,
                        message: "conflict",
                        data: {
                            tags: ["tag1", "tag2"],
                            updatedAt: docObj.tagsUpdatedAt,
                        },
                    },
                });
            });
        } finally {
            afterEach();
        }
    },
});

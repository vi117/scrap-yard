import { ChunkCreateHistory, handleChunkMethod } from "./chunk.ts";
import { assertEquals } from "std/assert";
import { stub } from "std/mock";
import { ActiveDocumentObject, DocStore } from "./docStore.ts";
import * as RPC from "model";
import { MockUser } from "./mockuser.ts";
import { MemoryDocReadWriter } from "../document/doc.ts";

Deno.test({
  name: "basic chunk operation",
  fn: async (t) => {
    const conn = new MockUser("connId");
    const docObj = new ActiveDocumentObject("docPath", 10, MemoryDocReadWriter);
    MemoryDocReadWriter.save("docPath", { chunks: [], tags: [], version: 1 });
    docObj.chunks = [];
    const docStore = stub(DocStore, "open", () => {
      return docObj;
    });
    try {
      await t.step("create chunk", async () => {
        await handleChunkMethod(conn, {
          method: "chunk.create",
          params: {
            docPath: "docPath",
            docUpdatedAt: docObj.updatedAt,
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
        }]);
      });
      await t.step("delete chunk", async () => {
        await handleChunkMethod(conn, {
          method: "chunk.delete",
          params: {
            docPath: "docPath",
            docUpdatedAt: docObj.updatedAt,
            chunkId: "chunkId",
          },
          jsonrpc: "2.0",
          id: 2,
        });
        const result = conn.popObject();
        assertEquals(result, {
          jsonrpc: "2.0",
          id: 2,
          result: {
            chunkId: "chunkId",
            updatedAt: docObj.updatedAt,
            seq: 2,
          },
        });
        assertEquals(docObj.chunks, []);
      });
      docObj.chunks = [{
        id: "chunkId1",
        type: "text",
        content: "content",
      }, {
        id: "chunkId2",
        type: "text",
        content: "content2",
      }];
      await t.step("modify chunk", async () => {
        await handleChunkMethod(conn, {
          method: "chunk.modify",
          params: {
            docPath: "docPath",
            docUpdatedAt: docObj.updatedAt,
            chunkContent: {
              type: "text",
              content: "content3",
            },
            chunkId: "chunkId1",
          },
          jsonrpc: "2.0",
          id: 3,
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
        assertEquals(docObj.chunks, [{
          id: "chunkId1",
          type: "text",
          content: "content3",
        }, {
          id: "chunkId2",
          type: "text",
          content: "content2",
        }]);
      });
      // TODO(vi117): write move chunk test
      // t.step("move chunk", async () => {});
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
        assertEquals(docObj.chunks, [{
          id: "chunkId1",
          type: "text",
          content: "content3",
        }, {
          id: "chunkId2",
          type: "text",
          content: "content2",
        }]);
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

    const docObj = new ActiveDocumentObject("docPath", 10, MemoryDocReadWriter);
    MemoryDocReadWriter.save("docPath", { chunks: [], tags: [], version: 1 });
    docObj.chunks = [];
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
// TODO(vi117): write conflict test

import { handleChunkMethod } from "./chunk.ts";
import { assertEquals } from "std/assert";
import { stub } from "std/mock";
import { ActiveDocumentObject, DocStore } from "./docStore.ts";
import { Participant } from "./connection.ts";
import * as RPC from "model";

Deno.test({
  name: "basic chunk operation",
  fn: async (t) => {
    const conn: Participant = {
      id: "connId",
      send() {},
      close() {},
      emit() {
        return true;
      },
      off() {
        return this;
      },
      on() {
        return this;
      },
    };
    const docObj = new ActiveDocumentObject("docPath");
    docObj.chunks = [];
    const docStore = stub(DocStore, "open", () => {
      return docObj;
    });
    try {
      await t.step("create chunk", async () => {
        const result = await handleChunkMethod(conn, {
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
        assertEquals(result, {
          jsonrpc: "2.0",
          id: 1,
          result: {
            chunkId: "chunkId",
          },
        });
        assertEquals(docObj.chunks, [{
          id: "chunkId",
          type: "text",
          content: "content",
        }]);
      });
      await t.step("delete chunk", async () => {
        const result = await handleChunkMethod(conn, {
          method: "chunk.delete",
          params: {
            docPath: "docPath",
            docUpdatedAt: docObj.updatedAt,
            chunkId: "chunkId",
          },
          jsonrpc: "2.0",
          id: 2,
        });
        assertEquals(result, {
          jsonrpc: "2.0",
          id: 2,
          result: {
            chunkId: "chunkId",
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
        const result = await handleChunkMethod(conn, {
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
        assertEquals(result, {
          jsonrpc: "2.0",
          id: 3,
          result: {
            chunkId: "chunkId1",
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
      // todo(vi117): write move chunk test
      // t.step("move chunk", async () => {});
      await t.step("invalid chunk operation", async () => {
        const result = await handleChunkMethod(conn, {
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
        assertEquals(result.error?.code, RPC.RPCErrorCode.InvalidPosition);
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
    }
  },
});

Deno.test({
  name: "test chunk notification operation",
  fn: async () => {
    const connAlice: Participant = {
      id: "connId",
      send() {},
      close() {},
      emit() {
        return true;
      },
      off() {
        return this;
      },
      on() {
        return this;
      },
    };
    const BobRecv: string[] = [];
    const connBob: Participant = {
      id: "connId",
      send(msg: string) {
        BobRecv.push(msg);
      },
      close() {},
      emit() {
        return true;
      },
      off() {
        return this;
      },
      on() {
        return this;
      },
    };
    const docObj = new ActiveDocumentObject("docPath");
    docObj.chunks = [];
    docObj.conns.add(connAlice);
    docObj.conns.add(connBob);
    docObj.updatedAt = 1000;
    const docStore = stub(DocStore, "open", () => {
      return docObj;
    });
    try {
      const result = await handleChunkMethod(connAlice, {
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
      const expected: RPC.ChunkNotification = {
        jsonrpc: "2.0",
        method: "chunk.update",
        params: {
          method: {
            id: 1,
            jsonrpc: "2.0",
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
          },
          updatedAt: docObj.updatedAt,
        },
      };
      assertEquals(JSON.parse(BobRecv[0]), expected);
      assertEquals(result, {
        jsonrpc: "2.0",
        id: 1,
        result: {
          chunkId: "chunkId",
        },
      });
    } finally {
      docStore.restore();
    }
  },
});

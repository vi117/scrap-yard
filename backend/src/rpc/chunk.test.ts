import { ChunkCreateHistory, handleChunkMethod } from "./chunk.ts";
import { assertEquals } from "std/assert";
import { stub } from "std/mock";
import { ActiveDocumentObject, DocStore } from "./docStore.ts";
import { Participant } from "./connection.ts";
import { createAdminUser } from "../auth/user.ts";
import * as RPC from "model";
import { RPCNotification, RPCResponse } from "model";

Deno.test({
  name: "basic chunk operation",
  fn: async (t) => {
    const messageBuffer: string[] = [];
    const conn: Participant = {
      id: "connId",
      send(s: string) {
        messageBuffer.push(s);
      },
      close() {},
      addEventListener() {},
      removeEventListener() {},
      user: createAdminUser("admin"),
      sendNotification(notification: RPCNotification): void {
        this.send(JSON.stringify(notification));
      },
      responseWith(data: RPCResponse): void {
        const json = JSON.stringify(data);
        this.send(json);
      },
    };
    const popObject = () => {
      const ret = messageBuffer.shift();
      if (ret === undefined) {
        throw new Error("no message");
      }
      return JSON.parse(ret);
    };
    const docObj = new ActiveDocumentObject("docPath", 10);
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
        const result = popObject();
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
        const result = popObject();
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
        const result = popObject();
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
        const result = popObject();
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
    }
  },
});

Deno.test({
  name: "test chunk notification operation",
  fn: async () => {
    const aliceMessageBuffer: string[] = [];
    const connAlice: Participant = {
      id: "connId",
      send(s) {
        aliceMessageBuffer.push(s);
      },
      close() {},
      addEventListener() {},
      removeEventListener() {},

      user: createAdminUser("alice"),
      sendNotification(notification: RPCNotification): void {
        this.send(JSON.stringify(notification));
      },
      responseWith(data: RPCResponse): void {
        const json = JSON.stringify(data);
        this.send(json);
      },
    };
    const popAliceObject = () => {
      const ret = aliceMessageBuffer.shift();
      if (ret === undefined) {
        throw new Error("no message");
      }
      return JSON.parse(ret);
    };
    const bobMessageBuffer: string[] = [];
    const connBob: Participant = {
      id: "connId",
      send(msg: string) {
        bobMessageBuffer.push(msg);
      },
      close() {},
      addEventListener() {},
      removeEventListener() {},
      user: createAdminUser("bob"),
      sendNotification(notification: RPCNotification): void {
        this.send(JSON.stringify(notification));
      },
      responseWith: function (data: RPCResponse): void {
        const json = JSON.stringify(data);
        this.send(json);
      },
    };
    const docObj = new ActiveDocumentObject("docPath", 10);
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
      const result = popAliceObject();
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
      const bobs = JSON.parse(bobMessageBuffer[0]);
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
    }
  },
});
// TODO(vi117): write conflict test

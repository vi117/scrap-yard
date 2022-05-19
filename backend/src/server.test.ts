import { join as pathJoin } from "std/path";
import { assert, assertEquals } from "std/assert";
import { getCurrentScriptDir } from "./util.ts";
import * as RPC from "model";
import { BufReader } from "https://deno.land/std@0.139.0/io/buffer.ts";
import { TextProtoReader } from "https://deno.land/std@0.139.0/textproto/mod.ts";
import { readAll } from "https://deno.land/std@0.139.0/streams/conversion.ts";

let serverHandle: Deno.Process<Deno.RunOptions & { stdout: "piped" }>;
async function startServer() {
  const currentDir = getCurrentScriptDir(import.meta);
  const cwd = pathJoin(Deno.cwd(), currentDir, "testdata");
  serverHandle = Deno.run({
    cmd: [Deno.execPath(), "run", "-A", "server_run.ts"],
    cwd: cwd,
    stdout: "piped",
    stderr: "null",
    env: {
      "SETTING_PATH": "test_setting.json",
      "PORT": "4567",
      "HOST": "localhost",
    },
  });
  assert(serverHandle.stdout !== null);
  const r = new TextProtoReader(new BufReader(serverHandle.stdout));
  const s = await r.readLine();
  assert(s !== null && s.includes("Server Start"));
}
async function stopServer() {
  serverHandle.close();
  await readAll(serverHandle.stdout!);
  serverHandle.stdout!.close();
}

type MethodResponseCallback = {
  resolve: (value: RPC.RPCResponse) => void;
  reject: (reason?: any) => void;
};

class WebSocketConnection {
  conn?: WebSocket;
  idMap: Map<number, MethodResponseCallback> = new Map();
  notificationBuffer: RPC.RPCNotification[] = [];
  constructor() {
  }
  open(): Promise<void> {
    const ret = new Promise<void>((resolve, reject) => {
      this.conn = new WebSocket("ws://localhost:4567/ws");
      this.conn.addEventListener("message", (e) => {
        const data = JSON.parse(e.data as string);
        if (data.id) {
          const result = this.idMap.get(data.id);
          if (result) {
            result.resolve(data.result);
            this.idMap.delete(data.id);
          } else {
            reject(data.error);
          }
        } else {
          const notification = data as RPC.RPCNotification;
          this.notificationBuffer.push(notification);
        }
      });
      this.conn.addEventListener("open", () => {
        resolve();
      });
      this.conn.onerror = (e) => {
        reject((e as ErrorEvent).error);
      };
    });
    return ret;
  }
  send(data: RPC.RPCMethod) {
    this.conn!.send(JSON.stringify(data));
    return new Promise<RPC.RPCResponse>((resolve, reject) => {
      this.idMap.set(data.id, { resolve, reject });
    });
  }
}

Deno.test({
  name: "server rpc test",
  fn: async () => {
    try {
      await startServer();
      const conn = new WebSocketConnection();
      await conn.open();
      let res = await conn.send({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "document.open",
        "params": { "docPath": "test.syd" },
      });
      const doc = (res as unknown as RPC.DocumentOpenResult).doc;
      const updatedAt = doc.updatedAt;
      const seq = doc.seq;
      assertEquals(doc.docPath, "test.syd");
      assertEquals(doc.chunks, [{
        "id": "1",
        "type": "text",
        "content": "content",
      }]);
      assertEquals(doc.tags, ["A", "B"]);

      res = await conn.send({
        "jsonrpc": "2.0",
        "id": 3,
        "method": "chunk.create",
        "params": {
          "docPath": "test.syd",
          "position": 1,
          "chunkId": "2",
          "chunkContent": { "type": "text", "content": "" },
          "docUpdatedAt": updatedAt,
        },
      });

      const chunkCreate = res as unknown as RPC.ChunkCreateResult;
      assertEquals(chunkCreate.chunkId, "2");
      assertEquals(chunkCreate.seq, seq + 1);

      res = await conn.send({
        "jsonrpc": "2.0",
        "id": 4,
        "method": "chunk.delete",
        "params": {
          "docPath": "test.syd",
          "chunkId": "2",
          "docUpdatedAt": chunkCreate.updatedAt,
        },
      });
      const chunkDelete = res as unknown as RPC.ChunkDeleteResult;
      assertEquals(chunkDelete.chunkId, "2");
      assertEquals(chunkDelete.seq, seq + 2);
    } finally {
      await stopServer();
    }
  },
});

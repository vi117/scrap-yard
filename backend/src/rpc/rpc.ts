import { handleDocumentMethod } from "./doc.ts";
import { handleChunkMethod } from "./chunk.ts";
import { MethodNotFoundError } from "model";
import * as RPC from "model";
import { Connection } from "./connection.ts";

function parseAndCheck(msg: string): RPC.RPCMethod {
  const p = JSON.parse(msg);
  if (p.jsonrpc !== "2.0") {
    throw new Error("Invalid JSON-RPC version");
  }
  if (typeof p.id !== "number") {
    throw new Error("Invalid JSON-RPC id");
  }
  if (typeof p.method !== "string") {
    throw new Error("Invalid JSON-RPC method");
  }
  if (typeof p.params !== "object") {
    throw new Error("Invalid JSON-RPC params");
  }
  return p;
}

async function handleMethods(
  conn: Connection,
  p: RPC.RPCMethod,
): Promise<RPC.RPCResponse> {
  switch (p.method) {
    case "document.open":
    case "document.close":
      return await handleDocumentMethod(conn, p);
    case "chunk.create":
    case "chunk.delete":
    case "chunk.modify":
    case "chunk.move":
      return await handleChunkMethod(conn, p);
    default:
  }
  throw new MethodNotFoundError("");
}

export async function handleMethodOnMessage(conn: Connection, msg: string) {
  const p = parseAndCheck(msg);
  try {
    const res = await handleMethods(conn, p);
    conn.send(JSON.stringify(res));
  } catch (e) {
    if (typeof p.id !== "number") {
      console.error(e);
      return;
    } else {
      conn.send(
        JSON.stringify(
          RPC.makeRPCError(p.id, new RPC.InternalError(e.message)),
        ),
      );
    }
  }
}

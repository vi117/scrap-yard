import { handleDocumentMethod, handleTagMethod } from "./doc.ts";
import { handleChunkMethod } from "./chunk.ts";
import { MethodNotFoundError } from "model";
import * as RPC from "model";
import { Connection } from "./connection.ts";
import * as log from "std/log";
import { handleShareMethod } from "./share.ts";

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
): Promise<void> {
    switch (p.method) {
        case "document.open":
        case "document.close":
            return await handleDocumentMethod(conn, p);
        case "chunk.create":
        case "chunk.delete":
        case "chunk.modify":
        case "chunk.move":
            return await handleChunkMethod(conn, p);
        case "document.getTag":
        case "document.setTag":
            return await handleTagMethod(conn, p);
        case "share.doc":
        case "share.info":
            return await handleShareMethod(conn, p);
        default:
    }
    throw new MethodNotFoundError("");
}

export async function handleMethodOnMessage(conn: Connection, msg: string) {
    let p: RPC.RPCMethod | undefined = undefined;
    try {
        p = parseAndCheck(msg);
        await handleMethods(conn, p);
    } catch (e) {
        if (p === undefined) {
            log.error(`invalid message: not rpc error ${e}`);
            return;
        } else {
            if (e instanceof Error) {
                log.error(`connection ${p.id}: ${e} error:\n ${e.stack}`);
            } else {
                log.error(`connection ${p.id}: ${e}`);
            }
            conn.responseWith(
                RPC.makeRPCError(p.id, new RPC.InternalError(e.message)),
            );
        }
    }
}

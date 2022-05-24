import { ChunkMethod, ChunkMethodResult, ChunkNotification } from "./chunk.ts";
import { DocumentMethod, DocumentMethodResult } from "./document.ts";
import { ShareMethod, ShareMethodResult, ShareNotification } from "./share.ts";
import {
    DocumentTagMethod,
    DocumentTagMethodResult,
    DocumentTagNotification,
} from "./tags.ts";
import { RPCError } from "./error.ts";
import { FileNotification } from "./file.ts";

export type MethodResult =
    | ChunkMethodResult
    | DocumentMethodResult
    | ShareMethodResult
    | DocumentTagMethodResult;

export type RPCMethod =
    | ChunkMethod
    | DocumentMethod
    | ShareMethod
    | DocumentTagMethod;

export type RPCNotification =
    | ChunkNotification
    | ShareNotification
    | DocumentTagNotification
    | FileNotification;

/**
 * RPC Response
 * @see https://www.jsonrpc.org/specification#response_object
 */
export interface RPCResponse {
    jsonrpc: "2.0";
    id: number;
    result?: MethodResult;
    error?: RPCError;
}
/**
 * helper function to create RPCResponse
 * @param id id of the request
 * @param result result of the request
 * @returns response
 */
export function makeRPCResult(id: number, result: MethodResult): RPCResponse {
    return {
        jsonrpc: "2.0",
        id,
        result,
    };
}
/**
 * helper function to create RPCResponse
 * @param id id of the request
 * @param error error of the request
 * @returns response
 */
export function makeRPCError(id: number, error: RPCError): RPCResponse {
    return {
        jsonrpc: "2.0",
        id,
        error,
    };
}

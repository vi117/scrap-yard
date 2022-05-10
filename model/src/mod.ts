import { ChunkMethod, ChunkMethodResult, ChunkNotification } from "./chunk.ts";
import { DocumentMethod, DocumentMethodResult } from "./document.ts";
import { RPCError } from "./error.ts";

export type MethodResult = ChunkMethodResult | DocumentMethodResult;

export type RPCMethod = ChunkMethod | DocumentMethod;

export type RPCNotification = ChunkNotification;

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
export function makeRPCResult(id: number, result?: MethodResult): RPCResponse {
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

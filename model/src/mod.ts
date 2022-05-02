import { ChunkMethod, ChunkMethodResult, ChunkNotification } from "./chunk.ts";
import { DocumentMethod, DocumentMethodResult } from "./document.ts";

/**
 * RPC Error codes
 * @see https://www.jsonrpc.org/specification#error_object
 */
export enum RPCErrorCode {
  // predefined error code
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  // custom error code
  InvalidDocPath = -20000, // docPath is invalid or not found
  InvalidChunkId = -20001, // chunk id is not found in the document
  InvalidChunkContent = -20002, // chunk content is invalid
  UnknownChunkContent = -20003, // chunk content is not supported
  InvalidPosition = -20004, // position is invalid, e.g. position is negative.
  InvalidTimestamp = -20005, // timestamp is invalid, e.g. timestamp is negative or timestamp is future.
  PermissionDenied = -20006, // permission denied.
}

/**
 * RPC Error
 * @see https://www.jsonrpc.org/specification#error_object
 */
export interface RPCError {
  code: RPCErrorCode;
  message: string;
  // deno-lint-ignore no-explicit-any
  data?: any;
}

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

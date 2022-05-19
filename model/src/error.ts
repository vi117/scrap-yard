import { Chunk } from "./chunk.ts";

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
  ChunkConflict = -20007, // conflict with another method.
  TagsConflict = -20008, // conflict with tags.
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

export class RPCErrorBase extends Error implements RPCError {
  code: RPCErrorCode;
  // deno-lint-ignore no-explicit-any
  data?: any;
  constructor(message: string, code: RPCErrorCode) {
    super(message);
    this.code = code;
  }
}

function RPCErrorBy(code: RPCErrorCode) {
  return class extends RPCErrorBase {
    constructor(message: string) {
      super(message, code);
    }
    toJSON() {
      return { "code": this.code, "message": this.message, "data": this.data };
    }
  };
}

export class ParseError extends RPCErrorBy(RPCErrorCode.ParseError) {
}
export class InvalidRequestError
  extends RPCErrorBy(RPCErrorCode.InvalidRequest) {
  constructor(message: string) {
    super(message);
  }
}

export class MethodNotFoundError
  extends RPCErrorBy(RPCErrorCode.MethodNotFound) {
  constructor(method: string) {
    super(`Unknown method: ${method}`);
    this.data = method;
  }
  declare data: string;
}
export class InvalidParamsError extends RPCErrorBy(RPCErrorCode.InvalidParams) {
  constructor(message: string) {
    super(message);
  }
}
export class InternalError extends RPCErrorBy(RPCErrorCode.InternalError) {
  /**
   * @param message error message
   * @param data error data
   */
  // deno-lint-ignore no-explicit-any
  constructor(message: string, data?: any) {
    super(message);
    this.data = data;
  }
}

export class InvalidDocPathError
  extends RPCErrorBy(RPCErrorCode.InvalidDocPath) {
  constructor(path: string) {
    super(`invalid doc path: ${path}`);
    this.data = path;
  }
  declare data: string;
}
export class InvalidChunkIdError
  extends RPCErrorBy(RPCErrorCode.InvalidChunkId) {
  constructor(chunkId: string) {
    super(`invalid chunk id: ${chunkId}`);
    this.data = chunkId;
  }
  declare data: string;
}
export class InvalidChunkContentError
  extends RPCErrorBy(RPCErrorCode.InvalidChunkContent) {
  constructor(message: string) {
    super(message);
  }
}
export class UnknownChunkContentError
  extends RPCErrorBy(RPCErrorCode.UnknownChunkContent) {
  constructor(chunkType: string) {
    super(`unknown chunk type: ${chunkType}`);
    this.data = chunkType;
  }
  declare data: string;
}
export class InvalidPositionError
  extends RPCErrorBy(RPCErrorCode.InvalidPosition) {
  constructor(pos: number) {
    super(`invalid pos: ${pos}`);
    this.data = { position: pos };
  }
  declare data: { position: number };
}
export class InvalidTimestampError
  extends RPCErrorBy(RPCErrorCode.InvalidTimestamp) {
  constructor(message: string) {
    super(message);
  }
}
export class PermissionDeniedError
  extends RPCErrorBy(RPCErrorCode.PermissionDenied) {
}

/**
 * Chunk Conflict Error
 * you can update the document with the chunks in the error.data.
 * @see {@link Synchronize.md}
 */
export class ChunkConflictError extends RPCErrorBy(RPCErrorCode.ChunkConflict) {
  constructor(chunks: Chunk[], updatedAt: number) {
    super(`conflict`);
    this.data = {
      chunks,
      updatedAt,
    };
  }
  declare data: {
    chunks: Chunk[];
    updatedAt: number;
  };
}

export class TagsConflictError extends RPCErrorBy(RPCErrorCode.TagsConflict) {
  constructor(tags: string[], updatedAt: number) {
    super(`conflict`);
    this.data = {
      tags,
      updatedAt,
    };
  }
  declare data: {
    tags: string[];
    updatedAt: number;
  };
}

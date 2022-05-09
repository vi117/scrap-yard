import { JsonRPCMethodHeader, JsonRPCNotificationHeader } from "./rpc.ts";

/**
 * Text Chunk
 */
export interface TextChunk {
  type: "text";
  content: string;
}

/**
 * Markdown Chunk
 */
export interface MarkdownChunk {
  type: "markdown";
  content: string;
}

export interface CSVChunk {
  type: "csv";
  content: string;
}

/**
 * Chunk Content
 */
export type ChunkContent = TextChunk | MarkdownChunk | CSVChunk;
export type ChunkContentKind = ChunkContent["type"];

export type Chunk = {
  id: string;
} & ChunkContent;

export type ChunkCreateParam = ChunkContent;
export type ChunkModifyParam = ChunkContent;

/**
 * Base of Chunk Method
 */
export interface ChunkMethodParamBase {
  /**
   * `docUpdateAt` is the time when the document was last updated.
   * it is used to determine whether the document is stale or not.
   * it is also used to determine whether its method conflicts with another methods to be called.
   * if conflict happens, the method will be rejected.
   */
  docUpdatedAt: number;
}
/**
 * Create Chunk Method
 * @returns `ChunkCreateResult` if success, otherwise return following type:
 * `ChunkConflictError`, `InternalError`, `PermissionDeniedError`, `UnknownChunkContentError`,
 * `InvalidChunkId`, `InvalidDocPath`, `InvalidPosition`, `InvalidTimestamp
 */
export interface ChunkCreateMethod extends JsonRPCMethodHeader {
  method: "chunk.create";
  params: ChunkMethodParamBase & {
    docPath: string;
    /**
     * position number to insert of the chunk
     *
     * for example,
     *  0 is before the first chunk.
     *  1 is after the first chunk.
     *  n is after the nth chunk.
     */
    position: number;
    /**
     * chunk id to create. if not specified, it will be generated automatically.
     */
    chunkId?: string;
    /**
     * chunk content to create
     */
    chunkContent: ChunkCreateParam;
  };
}
export interface ChunkCreateResult {
  /**
   * the created chunk id
   */
  chunkId: string;
  /**
   * document updated time at server 
   */
   updatedAt: number
}
/**
 * Chunk Delete Method
 */
export interface ChunkDeleteMethod extends JsonRPCMethodHeader {
  method: "chunk.delete";
  params: ChunkMethodParamBase & {
    docPath: string;
    chunkId: string;
  };
}
export interface ChunkDeleteResult {
  /**
   * the deleted chunk id
   */
  chunkId: string;
  /**
   * document updated time at server 
   */
  updatedAt: number
}
/**
 * Chunk Modify Method
 */
export interface ChunkModifyMethod extends JsonRPCMethodHeader {
  method: "chunk.modify";
  params: ChunkMethodParamBase & {
    docPath: string;
    chunkId: string;
    chunkContent: ChunkModifyParam;
  };
}
export interface ChunkModifyResult {
  /**
   * the modified chunk id
   */
  chunkId: string;
  /**
   * document updated time at server 
   */
  updatedAt: number
}
export interface ChunkMoveMethod extends JsonRPCMethodHeader {
  method: "chunk.move";
  params: ChunkMethodParamBase & {
    docPath: string;
    chunkId: string;
    /**
     * position number to insert of the chunk
     *
     * for example,
     *  0 is before the first chunk.
     *  1 is after the first chunk.
     *  n is after the nth chunk.
     */
    position: number;
  };
}
export interface ChunkMoveResult {
  /**
   * the moved chunk id
   */
  chunkId: string;
  /**
   * document updated time at server 
   */
  updatedAt: number
}

export type ChunkMethod =
  | ChunkCreateMethod
  | ChunkDeleteMethod
  | ChunkModifyMethod
  | ChunkMoveMethod;

export type ChunkMethodKind = ChunkMethod["method"];

export type ChunkMethodResult =
  | ChunkCreateResult
  | ChunkDeleteResult
  | ChunkModifyResult
  | ChunkMoveResult;

export interface ChunkUpdateNotification extends JsonRPCNotificationHeader {
  method: "chunk.update";
  params: {
    method: ChunkMethod;
    /**
     * the updated time of the document
     */
    updatedAt: number;
  };
}

export interface ChunkRefreshNotification extends JsonRPCNotificationHeader {
  method: "chunk.refresh";
  params: {
    /** if specified, refresh all chunks in the document */
    docPath?: string;
    /** if specified, refresh the specified url. */
    sources?: string[];
  };
}

export type ChunkNotification =
  | ChunkUpdateNotification
  | ChunkRefreshNotification;

export type ChunkNotificationKind = ChunkNotification["method"];

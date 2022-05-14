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

/**
 * CSV Chunk
 * it is a chunk of csv data
 */
export interface CSVChunk {
  type: "csv";
  content: string;
}

/**
 * HTML Chunk
 */
export interface RawHTMLChunk {
  type: "rawhtml";
  content: string;
}

/**
 * Image Chunk
 */
export interface ImageChunk {
  type: "image";
  /**
   * image url
   */
  content: string;
}

/**
 * Video Chunk
 */
export interface VideoChunk {
  type: "video";
  /**
   * video url
   */
  content: string;
}

/**
 * Audio Chunk
 */
export interface AudioChunk {
  type: "audio";
  /**
   * audio url
   */
  content: string;
}

//TODO(vi117): add more chunk types
//  "link", "code", "math",

/**
 * Chunk Content
 */
export type ChunkContent =
  | TextChunk
  | MarkdownChunk
  | CSVChunk
  | RawHTMLChunk
  | ImageChunk
  | VideoChunk
  | AudioChunk;
export type ChunkContentKind = ChunkContent["type"];

/**
 * helper function to check if obj is ChunkContent
 * @param obj object to check
 * @returns obj is ChunkContent
 */
export function isChunkContent(
  obj: unknown,
): obj is ChunkContent {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  if ("type" in obj) {
    return typeof (obj as ChunkContent).type === "string";
  }
  return false;
}

/**
 * helper function to compare ChunkContent
 * @param obj1 object to compare
 * @param obj2 object to compare
 * @returns obj1 is equal to obj2
 */
export function compareChunkContent(
  obj1: ChunkContent,
  obj2: ChunkContent,
): boolean {
  if (obj1.type !== obj2.type) {
    return false;
  }
  return obj1.content === obj2.content;
}

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
  updatedAt: number;
  /**
   * last sequence number of the operation.
   * it is used to determine the sequence of the operation.
   */
  seq: number;
}

export interface ChunkCreateNotificationParam {
  method: "chunk.create";
  position: number;
  chunkId: string;
  chunkContent: ChunkCreateParam;
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
  updatedAt: number;
  /**
   * last sequence number of the operation.
   * it is used to determine the sequence of the operation.
   */
  seq: number;
}

export interface ChunkDeleteNotificationParam {
  method: "chunk.delete";
  chunkId: string;
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
  updatedAt: number;
  /**
   * last sequence number of the operation.
   * it is used to determine the sequence of the operation.
   */
  seq: number;
}

export interface ChunkModifyNotificationParam {
  method: "chunk.modify";
  chunkId: string;
  chunkContent: ChunkModifyParam;
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
  updatedAt: number;
  /**
   * last sequence number of the operation.
   * it is used to determine the sequence of the operation.
   */
  seq: number;
}

export interface ChunkMoveNotificationParam {
  method: "chunk.move";
  chunkId: string;
  position: number;
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

export type ChunkNotificationParam =
  | ChunkCreateNotificationParam
  | ChunkDeleteNotificationParam
  | ChunkModifyNotificationParam
  | ChunkMoveNotificationParam;

export interface ChunkUpdateNotification extends JsonRPCNotificationHeader {
  method: "chunk.update";
  params: {
    /**
     * performed operation
     */
    method: ChunkNotificationParam;
    /**
     * path of the document
     */
    docPath: string;
    /**
     * the updated time of the document
     */
    updatedAt: number;
    /**
     * last sequence number of the operation.
     * it is used to determine the sequence of the operation.
     */
    seq: number;
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

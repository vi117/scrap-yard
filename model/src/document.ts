import { Chunk } from "./chunk.ts";

/**
 * You can use this method to get the document's chunks.
 * it subscribes to the `chunk.update` notification and `chunk.refresh` notification.
 */
export interface DocumentOpenMethod {
  method: "document.open";
  params: {
    docPath: string;
  };
}
export interface DocumentOpenResult {
  /**
   * the opened document path
   */
  docPath: string;
  chunks: Chunk[];
  tags: string[];
}

export type DocumentMethod = DocumentOpenMethod;
export type DocumentMethodResult = DocumentOpenResult;

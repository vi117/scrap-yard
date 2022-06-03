import { Chunk } from "./chunk.ts";
import { JsonRPCMethodHeader } from "./rpc.ts";

export interface DocumentObject {
    /**
     * the document path
     */
    docPath: string;
    chunks: Chunk[];
    updatedAt: number;
    seq: number;
    tags: string[];
    tagsUpdatedAt: number;
}

/**
 * You can use this method to get the document's chunks.
 * it subscribes to the `chunk.update` notification.
 */
export interface DocumentOpenMethod extends JsonRPCMethodHeader {
    method: "document.open";
    params: {
        docPath: string;
    };
}

export interface DocumentOpenResult {
    doc: DocumentObject;
    writable: boolean;
}

export interface DocumentCloseMethod extends JsonRPCMethodHeader {
    method: "document.close";
    params: {
        docPath: string;
    };
}
export interface DocumentCloseResult {
    /**
     * the closed document path
     * if the document is not opened, this value is `undefined`
     * if the document is already closed, this value is `undefined`
     */
    docPath?: string;
}

export type DocumentMethod = DocumentOpenMethod | DocumentCloseMethod;
export type DocumentMethodResult = DocumentOpenResult | DocumentCloseResult;

import * as RPC from "model";
import { readDocFile, saveDocFile } from "./filedoc.ts";

export interface DocumentContent {
  chunks: RPC.Chunk[];
  tags: string[];
  version: number;
}

export interface DocReadWriter {
  read(path: string): Promise<DocumentContent>;
  save(path: string, doc: DocumentContent): Promise<void>;
}

class DocFileReadWriterType implements DocReadWriter {
  read(path: string): Promise<DocumentContent> {
    return readDocFile(path);
  }
  save(path: string, doc: DocumentContent): Promise<void> {
    return saveDocFile(path, doc);
  }
}

export const DocFileReadWriter = new DocFileReadWriterType();

class MemoryDocReadWriterType implements DocReadWriter {
  private store: Map<string, DocumentContent>;
  constructor() {
    this.store = new Map();
  }
  read(path: string): Promise<DocumentContent> {
    const doc = this.store.get(path);
    if (doc) {
      return Promise.resolve(doc);
    }
    return Promise.reject(new Error("not found"));
  }
  save(path: string, doc: DocumentContent): Promise<void> {
    this.store.set(path, doc);
    return Promise.resolve();
  }

  clear() {
    this.store.clear();
  }
}

export const MemoryDocReadWriter = new MemoryDocReadWriterType();

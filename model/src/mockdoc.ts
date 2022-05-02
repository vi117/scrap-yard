import { CommonDocumentBase, IChunk } from "./doc.ts";

export class MockDocument<T extends IChunk> extends CommonDocumentBase {
  constructor(path: string, chunks: T[]) {
    super(path);
    this.chunks = chunks;
  }
}

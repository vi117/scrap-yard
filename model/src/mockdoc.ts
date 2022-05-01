import { CommonDocumentBase, IChunk } from "./doc.ts";

export class MockDocument extends CommonDocumentBase {
  constructor(path: string, chunks: IChunk[]) {
    super(path);
    this.chunks = chunks;
    this.chunks.forEach(x=>{
        x.owner = this;
    });
  }
}

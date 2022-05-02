import { CommonDocumentBase, IChunk, IDocument } from "model/dist/mod";

export { type IDocument };

export class DocumentAccessor {
  host: string;
  constructor(host: string) {
    this.host = host;
  }
  async getDocument(path: string): Promise<IDocument> {
    const ret = new DocumentModel(path, this);
    await ret.load();
    return ret;
  }
  async getChunks(path: string): Promise<IChunk[]> {
    const data = await fetch("/fs/" + path);
    const ret = await data.json();
    return ret as IChunk[];
  }
}

class DocumentModel extends CommonDocumentBase {
  docaccessor: DocumentAccessor;

  constructor(path: string, docaccessor: DocumentAccessor) {
    super(path);
    this.docaccessor = docaccessor;
  }
  async load() {
    const chunks = await this.docaccessor.getChunks(this.path);
    this.chunks = chunks;
  }
}

export function createDocumentAccessor(host: string): DocumentAccessor {
  return new DocumentAccessor(host);
}

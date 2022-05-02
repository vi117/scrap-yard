export interface IChunk {
  /**
   * The unique identifier of the chunk.
   */
  id: string;
  /**
   * The type of the chunk
   */
  type: string;
}

export class CommonChunkBase implements IChunk {
  id: string;
  type: string;
  constructor(id: string, type: string) {
    this.id = id;
    this.type = type;
  }
}

export interface IDocument {
  /**
   * The chunks of the document
   */
  chunks: IChunk[];

  /**
   * The path of the document
   * e.g. `./doc.md`
   */
  path: string;

  /**
   * The tags of the document
   */
  readonly tags: string[];
  setTags(tags: string[]): void;
  /**
   * remove the chunk from the document
   * @param chunk the chunk to be removed
   * @returns true if the chunk is removed, false if the chunk is not found
   */
  removeChunk(chunk: IChunk): boolean;
  /**
   * insert the chunk before the target chunk
   * @param target the target chunk
   * @param chunk the chunk to be inserted
   * @returns the inserted chunk
   * @throws Error if the target chunk is not in the document
   */
  insertChunkBefore(target: IChunk, chunk: IChunk): void;
  /**
   * insert the chunk after the target chunk
   * @param target the target chunk
   * @param chunk the chunk to be inserted
   * @returns the inserted chunk
   * @throws Error if the target chunk is not in the document
   */
  insertChunkAfter(target: IChunk, chunk: IChunk): void;

  /**
   * move the chunk to the target chunk
   * @param target the target chunk
   * @param chunk the chunk to be moved
   * @returns the moved chunk
   * @throws Error if the target chunk is not in the document
   * or the chunk is not in the document
   * or the target chunk is the same as the chunk
   */
  moveChunk(target: IChunk, chunk: IChunk): void;
}

export class CommonDocumentBase implements IDocument {
  chunks: IChunk[];
  path: string;
  tags: string[];
  constructor(path: string) {
    this.path = path;
    this.chunks = [];
    this.tags = [];
  }
  setTags(tags: string[]): void {
    this.tags = tags;
  }
  removeChunk(chunk: IChunk): boolean {
    const index = this.chunks.findIndex((c) => c.id === chunk.id);
    if (index >= 0) {
      this.chunks.splice(index, 1);
      return true;
    }
    return false;
  }
  insertChunkBefore(target: IChunk, chunk: IChunk): void {
    const index = this.chunks.findIndex((c) => c.id === target.id);
    if (index >= 0) {
      this.chunks.splice(index, 0, chunk);
    } else {
      throw new Error("Target chunk is not in the document");
    }
  }
  insertChunkAfter(target: IChunk, chunk: IChunk): void {
    const index = this.chunks.findIndex((c) => c.id === target.id);
    if (index >= 0) {
      this.chunks.splice(index + 1, 0, chunk);
    } else {
      throw new Error("Target chunk is not in the document");
    }
  }
  moveChunk(target: IChunk, chunk: IChunk): void {
    const index = this.chunks.findIndex((c) => c.id === target.id);
    const index2 = this.chunks.findIndex((c) => c.id === chunk.id);
    if (index >= 0 && index2 >= 0 && index !== index2) {
      this.chunks.splice(index2, 1);
      this.chunks.splice(index, 0, chunk);
    } else if (index < 0) {
      throw new Error("Target chunk is not in the document");
    } else if (index === index2) {
      throw new Error("Target chunk is the same as the chunk");
    } else if (index2 < 0) {
      throw new Error("Chunk is not in the document");
    }
  }
}

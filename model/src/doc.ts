
export type ChunkContent = {
  type: string;
  content: string | Uint8Array;
};

export interface IChunk {
  /**
   * The owner of the chunk
   */
  owner?: IDocument;
  /**
   * The type of the chunk
   */
  type: string;

  /**
   * the link which the chunk has
   * e.g. if content is `<a href="./doc.md">`, then the link is `["./doc.md"]`
   */
  getResources(): Promise<string[]>;
  /**
   * remove the chunk from the owner
   */
  remove(): void;
  /**
   * insert the chunk before the current chunk
   * @param chunk the chunk to insert
   * @returns the inserted chunk
   * @throws if the chunk is not owned by the owner
   */
  insertBefore(chunk: IChunk): IChunk;
  /**
   * insert the chunk after the current chunk
   * @param chunk the chunk to insert
   * @returns the inserted chunk
   * @throws if the chunk is not owned by the owner
   */
  insertAfter(chunk: IChunk): IChunk;

  /**
   * get content of the chunk
   */
  getContent(): ChunkContent;
}

export class CommonChunkBase implements IChunk {
  owner?: IDocument | undefined;
  type: string;
  constructor(type: string) {
    this.owner = undefined;
    this.type = type;
  }
  getResources(): Promise<string[]> {
    throw new Error("Method not implemented.");
  }
  remove(): void {
    if (this.owner) {
      this.owner.removeChunk(this);
    }
  }
  insertBefore(chunk: IChunk): IChunk {
    if (this.owner) {
      this.owner.insertChunkBefore(this, chunk);
    } else {
      throw new Error("Chunk is not owned by any document");
    }
    return chunk;
  }
  insertAfter(chunk: IChunk): IChunk {
    if (this.owner) {
      this.owner.insertChunkAfter(this, chunk);
    } else {
      throw new Error("Chunk is not owned by any document");
    }
    return chunk;
  }
  getContent(): ChunkContent {
    throw new Error("Method not implemented.");
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
    const index = this.chunks.findIndex((c) => c === chunk);
    if (index >= 0) {
      this.chunks.splice(index, 1);
      chunk.owner = undefined;
      return true;
    }
    return false;
  }
  insertChunkBefore(target: IChunk, chunk: IChunk): void {
    const index = this.chunks.findIndex((c) => c === target);
    if (index >= 0) {
      this.chunks.splice(index, 0, chunk);
      chunk.owner = this;
    } else {
      throw new Error("Target chunk is not in the document");
    }
  }
  insertChunkAfter(target: IChunk, chunk: IChunk): void {
    const index = this.chunks.findIndex((c) => c === target);
    if (index >= 0) {
      this.chunks.splice(index + 1, 0, chunk);
      chunk.owner = this;
    } else {
      throw new Error("Target chunk is not in the document");
    }
  }
}

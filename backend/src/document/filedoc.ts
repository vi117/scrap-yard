import { Chunk, DocumentObject } from "model";

export class FileDocumentObject implements DocumentObject {
  docPath: string;
  chunks: Chunk[];
  tags: string[];
  updatedAt: number;

  constructor(path: string) {
    this.docPath = path;
    this.chunks = [];
    this.tags = [];
    this.updatedAt = 0;
  }
  /**
   * open a file document with `this.docPath`
   * @returns Promise<FileDocument>
   * @throws Deno.errors.NotFound if the file does not exist
   * @throws Error if the file is not a valid file document
   */
  async open() {
    this.chunks = [];
    const content = await Deno.readTextFile(this.docPath);
    const data = JSON.parse(content);
    if (!(data instanceof Array)) {
      throw new Error("Invalid file format");
    }
    this.parse(data);
    this.updatedAt = Date.now();
  }
  parse(content: unknown[]) {
    for (const item of content) {
      if (
        typeof item !== "object" ||
        item === null ||
        !Object.hasOwnProperty.call(item, "type") ||
        // deno-lint-ignore no-explicit-any
        !(typeof (item as any).type === "string") ||
        !Object.hasOwnProperty.call(item, "id") ||
        // deno-lint-ignore no-explicit-any
        !(typeof (item as any).id === "string")
      ) {
        throw new Error("Invalid file format");
      }
      this.chunks.push(item as Chunk);
    }
  }
  async save() {
    await Deno.writeTextFile(
      this.docPath,
      JSON.stringify(this.chunks),
    );
  }
}

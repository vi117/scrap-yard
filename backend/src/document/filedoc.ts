import { CommonDocumentBase } from "./doc.ts";
import { createChunk } from "./chunk.ts";

class FileDocument extends CommonDocumentBase {
  constructor(path: string) {
    super(path);
    this.chunks = [];
    this.tags = [];
  }
  setTags(tags: string[]): void {
    this.tags = tags;
  }
  async open() {
    this.chunks = [];
    const content = await Deno.readTextFile(this.path);
    const data = JSON.parse(content);
    if (!(data instanceof Array)) {
      throw new Error("Invalid file format");
    }
    this.parse(data);
  }
  parse(content: unknown[]) {
    for (const item of content) {
      if (
        typeof item !== "object" ||
        item === null ||
        !Object.hasOwnProperty.call(item, "type") ||
        // deno-lint-ignore no-explicit-any
        !(typeof (item as any).type === "string")
      ) {
        throw new Error("Invalid file format");
      }
      // deno-lint-ignore no-explicit-any
      const chunk = createChunk(item as any);
      this.chunks.push(chunk);
      chunk.owner = this;
    }
  }
  async save() {
    await Deno.writeTextFile(
      this.path,
      JSON.stringify(this.chunks.map((x) => x.getContent())),
    );
  }
}

/**
 * open a file document
 * @param path path of the file
 * @returns Promise<FileDocument>
 */
export async function openFileDocument(path: string): Promise<FileDocument> {
  const doc = new FileDocument(path);
  await doc.open();
  return doc;
}

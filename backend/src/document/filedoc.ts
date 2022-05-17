import { Chunk, DocumentObject } from "model";

export class DocFormatError extends Error {
  constructor(public docPath: string, public message: string) {
    super(message);
  }
}

export type ReadDocFileOptions = {
  signal?: AbortSignal;
};

/**
 * open a file document with `path`
 * @returns Promise<DocumentObject>
 * @throws Deno.errors.NotFound if the file does not exist
 * @throws DocFormatError if the file is not a valid file document
 */
export async function readDocFile(
  path: string,
  options?: ReadDocFileOptions,
): Promise<DocumentObject> {
  options = options ?? {};
  const rawText = await Deno.readTextFile(path, { signal: options.signal });
  const data = JSON.parse(rawText);
  if (!("chunks" in data) || !("tags" in data)) {
    throw new DocFormatError(path, "Invalid document file");
  }

  if (!(data.chunks instanceof Array)) {
    throw new DocFormatError(path, "Invalid file format");
  }
  const content = data.chunks;
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
      throw new DocFormatError(path, "Invalid file format");
    }
  }
  const updatedAt = Date.now();
  return {
    docPath: path,
    chunks: content,
    tags: data.tags,
    updatedAt,
    seq: 0,
    tagsUpdatedAt: updatedAt,
  };
}

export type WriteDocFileOptions = {
  /**
   * a abort signal to allow cancellation of the operation
   */
  signal?: AbortSignal;
  /**
   * If true, create the file if it does not exist.
   * @default true
   */
  create?: boolean;
  /**
   * permissions applied to the document
   */
  mode?: number;
};

/**
 * save a file document to `path`
 * @param path the path to the document file
 * @param doc document object
 * @param options options
 */
export async function saveDocFile(
  path: string,
  doc: DocumentObject,
  options?: WriteDocFileOptions,
): Promise<void> {
  options ??= {};
  const data = {
    chunks: doc.chunks,
    tags: doc.tags,
  };
  const rawText = JSON.stringify(data);
  await Deno.writeTextFile(path, rawText, options);
}

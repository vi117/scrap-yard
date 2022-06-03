import { DocReadWriter, DocumentContent } from "./doc.ts";
import { IReadWriter, RawReadWriter } from "../watcher/mod.ts";

export class DocFormatError extends Error {
    constructor(public docPath: string, public message: string) {
        super(message);
    }
}

export type ReadDocFileOptions = {
    reader?: IReadWriter;
};

/**
 * open a file document with `path`
 * @returns Promise<DocumentContent>
 * @throws Deno.errors.NotFound if the file does not exist
 * @throws DocFormatError if the file is not a valid file document
 */
export async function readDocFile(
    path: string,
    options?: ReadDocFileOptions,
): Promise<DocumentContent> {
    options = options ?? {};
    const rw = options.reader ?? new RawReadWriter();
    const rawText = await rw.read(path);
    // deno-lint-ignore no-explicit-any
    let data: any;
    try {
        data = JSON.parse(rawText);
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new DocFormatError(path, error.message);
        } else {
            throw error;
        }
    }
    if (!("chunks" in data) || !("tags" in data) || !("version" in data)) {
        throw new DocFormatError(
            path,
            "Invalid document file: missing chunks, tags, or version",
        );
    }

    if (!(data.chunks instanceof Array)) {
        throw new DocFormatError(
            path,
            "Invalid file format: not array of chunks",
        );
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
            throw new DocFormatError(
                path,
                "Invalid file format: not valid chunk",
            );
        }
    }
    if (!(data.tags instanceof Array)) {
        throw new DocFormatError(
            path,
            "Invalid file format: not array for tags",
        );
    }
    if (data.version !== 1) {
        throw new DocFormatError(
            path,
            "Unknown version format " + data.version,
        );
    }
    return {
        chunks: content,
        tags: data.tags,
        version: data.version,
    };
}

export type WriteDocFileOptions = {
    writer?: IReadWriter;
};

/**
 * save a file document to `path`
 * @param path the path to the document file
 * @param doc document object
 * @param options options
 */
export async function saveDocFile(
    path: string,
    doc: DocumentContent,
    options?: WriteDocFileOptions,
): Promise<void> {
    options ??= {};
    const data = {
        chunks: doc.chunks,
        tags: doc.tags,
        version: doc.version,
    };
    const rawText = JSON.stringify(data);
    const rw = options.writer ?? new RawReadWriter();
    await rw.write(path, rawText);
}

export class DocFileReadWriterType implements DocReadWriter {
    rw: IReadWriter;
    constructor(options?: {
        rw?: IReadWriter;
    }) {
        this.rw = options?.rw ?? new RawReadWriter();
    }
    read(path: string): Promise<DocumentContent> {
        return readDocFile(path, { reader: this.rw });
    }
    save(path: string, doc: DocumentContent): Promise<void> {
        return saveDocFile(path, doc, { writer: this.rw });
    }
}

export const DocFileReadWriter = new DocFileReadWriterType();

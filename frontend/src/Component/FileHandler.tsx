// this module provides handleFile function.

import { extname } from "path-browserify";

import { getFsManagerInstance, IFsManager } from "../Model/FsManager";

const emptyDocument = { version: 1, tags: [], chunks: [] };
const emptyFile = new Blob([JSON.stringify(emptyDocument)], {
    type: "application/json",
});

function appendExt(f: string): string {
    if (extname(f) == "") f = f + ".syd";
    return f;
}

export async function handleFile(
    com: string,
    args: { path: string; newpath?: string },
    raise: (e: Error) => void,
) {
    const fs = await getFsManagerInstance();

    switch (com) {
        case "create":
            // create document by uploading Blob
            fs.upload(appendExt(args.path), emptyFile).catch(raise);
            break;

        case "rename":
            if (args.newpath) {
                fs.rename(args.path, appendExt(args.newpath)).catch(raise);
            } else {
                raise(new Error("No new name"));
            }
            break;
        case "move":
            break;
        case "delete":
            fs.delete(args.path).catch(raise);
            break;
        default:
            raise({
                message: "not a command",
                name: "",
            });
    }
}

export default handleFile;

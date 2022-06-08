// this module provides handleFile function.

import { getFsManagerInstance, IFsManager } from "../Model/FsManager";

const emptyDocument = { version: 1, tags: [], chunks: [] };
const emptyFile = new Blob([JSON.stringify(emptyDocument)], {
    type: "application/json",
});

export async function handleFile(
    com: string,
    args: { path: string; newpath?: string },
    raise: (e: Error) => void,
) {
    const fs = await getFsManagerInstance();

    switch (com) {
        case "create":
            // create document by uploading Blob
            fs.upload(args.path, emptyFile);
            break;

        case "rename":
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

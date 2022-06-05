// this module provides handleFile function.

import { getFsManagerInstance, IFsManager } from "../Model/FsManager";

export async function handleFile(
    com: string,
    args: { path: string; newpath?: string },
    raise: (e: Error) => void,
) {
    const fs = await getFsManagerInstance();

    switch (com) {
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

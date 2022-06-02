import { serverRun } from "./src/server.ts";
import * as log from "std/log";
import * as setting from "./src/setting.ts";

async function exists(path: string) {
    try {
        const stat = await Deno.stat(path);
        return stat.isFile;
    } catch (e) {
        return false;
    }
}

if (import.meta.main) {
    await log.setup({
        handlers: {
            console: new log.handlers.ConsoleHandler("DEBUG"),
        },
        loggers: {
            default: {
                level: "DEBUG",
                handlers: ["console"],
            },
        },
    });

    Deno.chdir("testworkspace");
    await setting.load();
    if (!await exists(setting.getPath())) {
        await setting.save();
    }

    await serverRun();
}

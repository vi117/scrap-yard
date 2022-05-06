import { serverRun } from "./src/server.ts";
import * as log from "std/log";

await log.setup({
    handlers: {
        console: new log.handlers.ConsoleHandler("DEBUG"),
    },
    loggers:{
        default:{
            level:"DEBUG",
            handlers:["console"],
        },
    }
})

Deno.chdir("testworkspace");
serverRun();

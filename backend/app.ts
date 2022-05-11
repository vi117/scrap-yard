import { serverRun } from "./src/server.ts";
import * as log from "std/log";
import * as setting from "./src/setting.ts";

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
  serverRun();
}

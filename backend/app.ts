import { serverRun } from "./src/server.ts";

Deno.chdir("testworkspace");
serverRun();

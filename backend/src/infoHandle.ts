import { makeJsonResponse, MethodHandlerBuilber } from "./router/mod.ts";
import { VERSION } from "./version.ts";
import { Status } from "std/http";
import { getAllowAnonymous } from "./auth/session.ts";
import { getServerSetting } from "./server.ts";

export function getServerInformationHandler() {
  return (new MethodHandlerBuilber()).get(() => {
    const { host, port } = getServerSetting();
    return makeJsonResponse(Status.OK, {
      "name": "scrap-yard-server",
      "version": VERSION,
      "description": "A simple server",
      "host": host,
      "port": port,
      "allowAnonymous": getAllowAnonymous(),
    });
  }).build();
}

import {
    Handler,
    makeJsonResponse,
    MethodHandlerBuilber,
} from "./router/mod.ts";
import { VERSION } from "./version.ts";
import { Status } from "std/http";
import { getAllowAnonymous } from "./auth/session.ts";

export function getServerInformationHandler(
    port: number,
    host: string,
): Handler {
    return (new MethodHandlerBuilber()).get(() => {
        // if you want to change the response, you should
        // change `ServerInfo` in `frontend/model/serverInfo.ts`.
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

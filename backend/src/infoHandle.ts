import {
    Handler,
    makeJsonResponse,
    MethodHandlerBuilber,
} from "./router/mod.ts";
import { VERSION } from "./version.ts";
import { Status } from "std/http";
import { getAllowAnonymous } from "./auth/session.ts";

export function getServerInformationHandler(): Handler {
    return (new MethodHandlerBuilber()).get((req) => {
        // if you want to change the response, you should
        // change `ServerInfo` in `frontend/model/serverInfo.ts`.
        const url = new URL(req.url);
        return makeJsonResponse(Status.OK, {
            "name": "scrap-yard-server",
            "version": VERSION,
            "description": "A simple server",
            "host": url.host,
            "port": url.port,
            "allowAnonymous": getAllowAnonymous(),
        });
    }).build();
}

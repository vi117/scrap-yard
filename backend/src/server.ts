import { ConnInfo, serve } from "std/http";
import {
    getStaticRouter,
    Handler,
    makeRedirect,
    makeResponse,
    Status,
    TreeRouter,
} from "./router/mod.ts";
import { FileServeRouter } from "./fileServe.ts";
import { rpc } from "./rpc.ts";
import * as log from "std/log";
import { getServerInformationHandler } from "./infoHandle.ts";
import { handleLogin, handleLogout } from "./auth/session.ts";
import { configLoadFrom } from "./config.ts";
import { parse as argParse } from "std/flags";
import "std/dotenv";
import { ResponseBuilder } from "./router/responseBuilder.ts";

const router = new TreeRouter<Handler>();

router.register("/", (_req) => {
    return makeRedirect("/app");
});

router.registerRouter("dist", getStaticRouter("dist"));
router.registerRouter("fs", new FileServeRouter());
router.register("/app", app);
router.register("/ws", rpc);
router.register("/auth/login", handleLogin);
router.register("/auth/logout", handleLogout);

function app() {
    return new ResponseBuilder("Hello World!").setStatus(200);
}

export async function serverRun() {
    const args = argParse(Deno.args);
    const config = await configLoadFrom(args.config ?? "config.jsonc");
    console.log(`Server Start`);

    const sih = getServerInformationHandler();
    router.register("info", sih);
    serve(async (req: Request, _info: ConnInfo) => {
        const begin = Date.now();
        let response: ResponseBuilder;
        try {
            response = await serveRequest(req);
        } catch (e) {
            console.error(e);
            response = makeResponse(Status.InternalServerError);
        }
        const end = Date.now();
        log.info(
            `${(new Date()).toISOString()} ${req.method} ${req.url}: ${
                end - begin
            }ms, response: ${response.status}`,
        );
        return response.build();
    }, { port: config.port, hostname: "0.0.0.0" });

    async function serveRequest(req: Request) {
        const ctx = {};
        const url = new URL(req.url);
        const origin = req.headers.get("origin");
        const m = router.match(url.pathname, ctx);
        if (m) {
            const res = await m(req, ctx);
            res.setHeaders({
                "access-control-allow-origin": origin ?? "*",
                "access-control-allow-credentials": "true",
            });
            return res;
        }
        return makeResponse(Status.NotFound);
    }
    log.info(`listening on http://${"0.0.0.0"}:${config.port}`);
}

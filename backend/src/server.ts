import { ConnInfo, serve } from "std/http";
import { Args as ParsedArgs, parse as argParse } from "std/flags";
import "std/dotenv";
import { join as pathJoin } from "std/path";
import * as log from "std/log";
import * as fs from "std/fs";

import {
    getStaticRouter,
    Handler,
    makeRedirect,
    makeResponse,
    MethodHandlerBuilber,
    Status,
    TreeRouter,
} from "./router/mod.ts";
import { FileServeRouter } from "./fileServe.ts";
import { rpc } from "./rpc.ts";
import { getServerInformationHandler } from "./infoHandle.ts";
import {
    getAuthHandler,
    handleGetSessionUserInfo,
    setAllowAnonymous,
} from "./auth/session.ts";
import { configLoadFrom, ConfigSchema } from "./config.ts";
import { ResponseBuilder } from "./router/responseBuilder.ts";
import { fileWatcher } from "./rpc/filewatch.ts";
import { loadShareDocStore, setShareDocStorePath } from "./auth/docShare.ts";

const router = new TreeRouter<Handler>();

router.register("/", (_req) => {
    return makeRedirect("/app");
});

router.registerRouter("fs", new FileServeRouter());
router.register("/ws", rpc);

export async function serverRun(distPath: string) {
    const args = argParse(Deno.args);
    const config = await loadConfig(args);

    console.log(`Server Start`);

    // serve static files
    initStaticFileServe(distPath);

    // set infomation handler
    const sih = getServerInformationHandler();
    router.register("info", sih);

    await initSessionHandler(config);

    // start watching file
    fileWatcher.startWatching();

    let port = config.port ?? (parseInt(Deno.env.get("PORT") ?? ""));
    if (isNaN(port)) {
        log.info(`port is not a number: ${port}. use default port 8080`);
        port = 8080;
    }

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
    }, { port: port, hostname: "0.0.0.0" });

    async function serveRequest(req: Request) {
        const ctx = {};
        const url = new URL(req.url);
        const origin = req.headers.get("origin");
        const m = router.match(url.pathname, ctx);
        if (m) {
            const res = await m(req, ctx);
            if (!!origin && config.hosts.includes(origin)) {
                res.setCors(origin, true);
            }
            return res;
        }
        return makeResponse(Status.NotFound);
    }
    log.info(`listening on http://${"0.0.0.0"}:${config.port}`);
}

async function loadConfig(args: ParsedArgs) {
    const configPath = args.config ?? Deno.env.get("CONFIG_PATH");
    if (configPath) {
        return await configLoadFrom(configPath);
    } else {
        fs.ensureDirSync(".scrap-yard");
        return configLoadFrom(".scrap-yard/config.jsonc");
    }
}

function initStaticFileServe(distPath: string) {
    // serve static files
    function serveIndex(req: Request) {
        return new ResponseBuilder().serveFile(
            req,
            pathJoin(distPath, "index.html"),
        );
    }
    const staticIndexRouter = {
        match() {
            return new MethodHandlerBuilber().get(serveIndex).build();
        },
    };
    router.registerRouter("/app", staticIndexRouter);
    router.registerRouter("/token", staticIndexRouter);
    router.registerRouter("/login", staticIndexRouter);
    router.registerRouter(
        "/assets",
        getStaticRouter(pathJoin(distPath, "assets")),
    );
}

async function initSessionHandler(config: ConfigSchema) {
    // set config and load share doc store
    // set auth handler
    setAllowAnonymous(config.allowAnonymous);
    setShareDocStorePath(config.shareDocStorePath);
    await loadShareDocStore();

    const sessionSecret = Deno.env.get("SESSION_SECRET") ??
        config.sessionSecret;
    const password = Deno.env.get("PASSWORD") ?? config.password;

    const { handleLogin, handleLogout } = await getAuthHandler({
        password: password,
        secret: sessionSecret,
        sessionPath: config.sessionPath,
    });

    router.register("/auth/login", handleLogin);
    router.register("/auth/logout", handleLogout);
    router.register("/auth/info", handleGetSessionUserInfo);
}

import { serve } from "std/http";
import {
  getStaticRouter,
  Handler,
  makeResponse,
  Status,
  TreeRouter,
} from "./router/mod.ts";
import { FileServeRouter } from "./fileServe.ts";
import { rpc } from "./rpc.ts";
import * as log from "std/log";
import * as setting from "./setting.ts";
import { getServerInformationHandler } from "./infoHandle.ts";

const router = new TreeRouter<Handler>();

router.register("/", (_req) => {
  return new Response("Hello World!", {
    status: 200,
    statusText: "OK",
    headers: {
      "Content-Type": "text/plain",
    },
  });
});

router.registerRouter("dist", getStaticRouter("dist"));
router.registerRouter("fs", new FileServeRouter());
router.register("/app", app);
router.register("/ws", rpc);

function app() {
  return new Response("Hello World!", {
    status: 200,
    statusText: "OK",
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

setting.register("server", {
  type: "object",
  properties: {
    port: { type: "number", default: 8000 },
    host: { type: "string", default: "localhost" },
  },
});

type ServerSetting = {
  port: number;
  host: string;
};

export function getServerSetting(): ServerSetting {
  const s = setting.get<ServerSetting>("server");
  return s;
}

export function serverRun() {
  console.log(`Server Start`);
  const s = getServerSetting();

  const sih = getServerInformationHandler();
  router.register("info", sih);
  serve((req: Request) => {
    try {
      return serveRequest(req);
    } catch (e) {
      console.error(e);
      return makeResponse(Status.InternalServerError);
    }
  }, { port: s.port, hostname: s.host });

  function serveRequest(req: Request) {
    const ctx = {};
    const url = new URL(req.url);
    log.info(`${(new Date()).toUTCString()} ${req.method} ${req.url}`);
    const m = router.match(url.pathname, ctx);
    if (m) {
      return m(req, ctx);
    }
    return makeResponse(Status.NotFound);
  }
  log.info(`listening on http://${s.host}:${s.port}`);
}

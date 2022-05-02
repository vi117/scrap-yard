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

export function serverRun() {
  console.log("host is http://localhost:8000");
  serve((req: Request) => {
    try {
      return serveRequest(req);
    } catch (e) {
      console.error(e);
      return makeResponse(Status.InternalServerError);
    }
  }, { port: 8000 });

  function serveRequest(req: Request) {
    const ctx = {};
    const url = new URL(req.url);
    console.log(`${(new Date()).toUTCString()} ${req.method} ${req.url}`);
    const m = router.match(url.pathname, ctx);
    if (m) {
      return m(req, ctx);
    }
    return makeResponse(Status.NotFound);
  }
}

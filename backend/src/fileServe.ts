import {
  Handler,
  isQueryValueTrue,
  makeJsonResponse,
  makeResponse,
  MatchContext,
  MethodRouterBuilber,
  Router,
  Status,
} from "./router/mod.ts";
import { extname, normalize } from "std/path";
import { serveFile } from "std/file_server";
import { copy, readerFromStreamReader } from "std/streams";
import { asyncAll } from "./util.ts";

const DOC_EXT = ".syd";

export class FileServeRouter implements Router<Handler> {
  fn: Handler;
  constructor() {
    this.fn = new MethodRouterBuilber()
      .get(getHandler)
      .put(putHandler)
      .delete(deleteHandler)
      .build();
    async function getHandler(req: Request, ctx: MatchContext) {
      const path = ctx["path"];
      const url = new URL(req.url);
      const isRaw = url.searchParams.get("raw");
      if (isQueryValueTrue(isRaw)) {
        const stat = await Deno.stat(path);
        if (stat.isDirectory) {
          const method = req.method.toLocaleLowerCase();
          if (method == "get") {
            return makeJsonResponse(Status.OK, {
              fileList: (await asyncAll(await Deno.readDir(path))).map((v) =>
                v
              ),
            });
          }
          return makeResponse(Status.MethodNotAllowed);
        } else {
          return await serveFile(req, path);
        }
      } else {
        const stat = await Deno.stat(path);
        if (stat.isDirectory) {
          return makeResponse(
            Status.BadRequest,
            "directory request must have raw query param",
          );
        } else {
          const ext = extname(path);
          if (ext == DOC_EXT) {
            const doc = await Deno.readTextFile(path);
            return makeResponse(Status.OK, doc, {
              "Content-Type": "application/json",
            });
          }
        }
      }
      throw new Error("not implemented");
    }
    async function putHandler(req: Request, ctx: MatchContext) {
      const path = ctx["path"];
      const url = new URL(req.url);
      const isRaw = url.searchParams.get("raw");
      if (isQueryValueTrue(isRaw)) {
        const body = req.body;
        const file = await Deno.open(path, {
          write: true,
          append: false,
          create: true,
          truncate: true,
        });
        if (body) {
          console.log(path, body);
          const src = readerFromStreamReader(body.getReader());
          await copy(src, file);
        }
        file.close();
        return makeResponse(
          Status.OK,
          JSON.stringify({
            ok: true,
          }),
        );
      }
      throw new Error("not implemented");
    }
    async function deleteHandler(req: Request, ctx: MatchContext) {
      const path = ctx["path"];
      const url = new URL(req.url);
      const isRaw = url.searchParams.get("raw");
      if (isQueryValueTrue(isRaw)) {
        await Deno.remove(path, { recursive: true });
        return makeResponse(
          Status.OK,
          JSON.stringify({
            ok: true,
          }),
        );
      }
      throw new Error("not implemented");
    }
  }
  match(path: string, _ctx: MatchContext): Handler | null {
    return async (req, ctx) => {
      path = normalize(path);
      if (path.startsWith("/")) {
        path = path.substring(1);
      }
      if (path.startsWith("..")) {
        return makeResponse(Status.BadRequest);
      }
      ctx["path"] = path;
      try {
        return await this.fn(req, ctx);
      } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
          return makeResponse(Status.NotFound);
        }
        throw e;
      }
    };
  }
}

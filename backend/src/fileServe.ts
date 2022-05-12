import {
  Handler,
  makeJsonResponse,
  makeResponse,
  MatchContext,
  MethodRouterBuilber,
  Router,
  Status,
} from "./router/mod.ts";
import { normalize } from "std/path";
import { serveFile } from "std/file_server";
import { copy, readerFromStreamReader } from "std/streams";
import { asyncAll } from "./util.ts";
import { getSessionUser } from "./auth/session.ts";
import * as log from "std/log";

export class FileServeRouter implements Router<Handler> {
  fn: Handler;
  constructor() {
    this.fn = new MethodRouterBuilber()
      .get(getHandler)
      .put(putHandler)
      .delete(deleteHandler)
      .build();
    //TODO(vi117): file diff propergate to other clients

    async function getHandler(req: Request, ctx: MatchContext) {
      const path = ctx["path"];
      const user = getSessionUser(req);
      const url = new URL(req.url);
      const isStat = url.searchParams.get("stat") === "true";

      if (!user.permissionSet.canRead(path)) {
        log.warning(`${user.id} try to read ${path}`);
        return makeResponse(Status.Forbidden);
      }

      const stat = await Deno.stat(path);
      if (isStat) {
        if (stat.isDirectory) {
          return makeJsonResponse(Status.OK, {
            ...stat,
            entries: (await asyncAll(await Deno.readDir(path)))
              .map((v) => v),
          });
        } else {
          return makeJsonResponse(Status.OK, {
            ...stat,
          });
        }
      } else {
        if (stat.isDirectory) {
          return makeResponse(Status.BadRequest, "Not file");
        }

        return await serveFile(req, path, { fileInfo: stat });
      }
    }

    async function putHandler(req: Request, ctx: MatchContext) {
      const path = ctx["path"];
      const user = getSessionUser(req);
      if (!user.permissionSet.canWrite(path)) {
        log.warning(`${user.id} try to write ${path}`);
        return makeResponse(Status.Forbidden);
      }
      const body = req.body;
      let file: Deno.FsFile | null = null;
      try {
        file = await Deno.open(path, {
          write: true,
          append: false,
          create: true,
          truncate: true,
        });
        if (body) {
          const src = readerFromStreamReader(body.getReader());
          await copy(src, file);
        }
        return makeResponse(
          Status.OK,
          JSON.stringify({
            ok: true,
          }),
        );
      } catch (error) {
        throw error;
      } finally {
        if (file) {
          file.close();
        }
      }
    }

    async function deleteHandler(req: Request, ctx: MatchContext) {
      const path = ctx["path"];
      const user = getSessionUser(req);
      if (!user.permissionSet.canWrite(path)) {
        log.warning(`${user.id} try to delete ${path}`);
        return makeResponse(Status.Forbidden);
      }
      await Deno.remove(path, { recursive: true });
      return makeResponse(
        Status.OK,
        JSON.stringify({
          ok: true,
        }),
      );
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

import {
  Handler,
  makeJsonResponse,
  makeResponse,
  MatchContext,
  MethodHandlerBuilber,
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
    this.fn = new MethodHandlerBuilber()
      .get(getHandler)
      .post(postHandler)
      .put(putHandler)
      .delete(deleteHandler)
      .build();
    //TODO(vi117): file diff propergate to other clients

    async function getHandler(req: Request, ctx: MatchContext) {
      const user = getSessionUser(req);
      const path = user.joinPath(ctx["path"]);
      const url = new URL(req.url);
      const isStat = url.searchParams.get("stat") === "true";

      if (!user.canRead(path)) {
        log.warning(`${user.id} try to read ${path}`);
        return makeJsonResponse(Status.Forbidden, {
          ok: false,
          msg: "Forbidden",
        });
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
          return makeJsonResponse(Status.BadRequest, {
            ok: false,
            msg: "Not file",
          });
        }

        return await serveFile(req, path, { fileInfo: stat });
      }
    }

    async function postHandler(req: Request, ctx: MatchContext) {
      const user = getSessionUser(req);
      const path = user.joinPath(ctx["path"]);
      const url = new URL(req.url);

      if (!user.canWrite(path)) {
        log.warning(`${user.id} try to write ${path}`);
        return makeJsonResponse(Status.Forbidden, {
          ok: false,
          msg: "Forbidden",
        });
      }

      const p = url.searchParams.get("renameTo");

      if (p) {
        const newPath = user.joinPath(p);
        if (!user.canWrite(newPath)) {
          log.warning(`${user.id} try to write ${newPath}`);
          return makeJsonResponse(Status.Forbidden, {
            ok: false,
            msg: "Forbidden",
          });
        }
        await Deno.rename(path, newPath);
        return makeJsonResponse(Status.OK, {
          ok: true,
        });
      }
      return makeJsonResponse(Status.BadRequest, {
        ok: false,
        msg: "Bad request",
      });
    }

    async function putHandler(req: Request, ctx: MatchContext) {
      const user = getSessionUser(req);
      const path = user.joinPath(ctx["path"]);
      const url = new URL(req.url);
      if (!user.canWrite(path)) {
        log.warning(`${user.id} try to write ${path}`);
        return makeJsonResponse(Status.Forbidden, {
          ok: false,
          error: "Forbidden",
        });
      }
      if (url.searchParams.get("makeDir") === "true") {
        await Deno.mkdir(path, { recursive: true });
        return makeJsonResponse(Status.OK, {
          ok: true,
        });
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
        return makeJsonResponse(
          Status.OK,
          {
            ok: true,
          },
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
      const user = getSessionUser(req);
      const path = user.joinPath(ctx["path"]);
      if (!user.canWrite(path)) {
        log.warning(`${user.id} try to delete ${path}`);
        return makeJsonResponse(Status.Forbidden, {
          ok: false,
          msg: "Forbidden",
        });
      }
      try {
        await Deno.remove(path, { recursive: true });
        return makeResponse(
          Status.OK,
          JSON.stringify({
            ok: true,
          }),
        );
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          return makeJsonResponse(Status.NotFound, {
            ok: false,
            msg: "Not found",
          });
        } else if (error instanceof Deno.errors.PermissionDenied) {
          return makeJsonResponse(Status.Forbidden, {
            ok: false,
            msg: "Permission denied",
          });
        } else throw error;
      }
    }
  }

  match(path: string, _ctx: MatchContext): Handler | null {
    return async (req, ctx) => {
      path = normalize(path);
      if (path.startsWith("/")) {
        path = path.substring(1);
      }
      if (path.startsWith("..")) {
        return makeJsonResponse(Status.BadRequest, {
          ok: false,
          msg: "Bad request",
        });
      }
      ctx["path"] = path;
      try {
        return await this.fn(req, ctx);
      } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
          return makeJsonResponse(Status.NotFound, {
            ok: false,
            msg: "Not found",
          });
        }
        throw e;
      }
    };
  }
}

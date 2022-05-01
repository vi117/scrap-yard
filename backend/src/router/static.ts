import { Handler } from "./handler.ts";
import { serveFile } from "std/file_server";
import { join } from "std/path";
import { MethodRouterBuilber } from "./methodRoute.ts";
import { Router } from "./route.ts";

export function getStaticHandler(path: string): Handler {
  return new MethodRouterBuilber().get(
    async (req: Request) => {
      return await serveFile(req, path);
    },
  ).build();
}

export function getStaticRouter(root: string): Router<Handler> {
  return {
    match: (path: string) => {
      if (path.startsWith("..")) {
        return null;
      }
      const filePath = path.startsWith("/") ? path.substring(1) : path;
      const fullPath = join(root, filePath);
      return getStaticHandler(fullPath);
    },
  };
}

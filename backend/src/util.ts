import { fromFileUrl, join as pathJoin, relative } from "std/path";

export async function asyncAll<T>(a: AsyncIterable<T>): Promise<Awaited<T>[]> {
  const ret = [];
  for await (const v of a) {
    ret.push(v);
  }
  return ret;
}

export class IdGenerator {
  private id = 0;
  next(): number {
    return this.id++;
  }
}

export function getCurrentScriptDir(importMeta: ImportMeta): string {
  const scriptDir = pathJoin(
    relative(Deno.cwd(), fromFileUrl(importMeta.url)),
    "..",
  );
  return scriptDir;
}

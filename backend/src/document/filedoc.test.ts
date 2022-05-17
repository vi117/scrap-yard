import { assertEquals } from "std/assert";
import { readDocFile } from "./filedoc.ts";
import { join as pathJoin } from "std/path";
import { getCurrentScriptDir } from "../util.ts";

Deno.test({
  name: "readDocFile",
  fn: async () => {
    const docPath = pathJoin(
      getCurrentScriptDir(import.meta),
      "testdata/doc1.json",
    );
    const doc = await readDocFile(docPath);
    assertEquals(doc.docPath, docPath);
    assertEquals(doc.chunks.length, 3);
    assertEquals(doc.tags.length, 2);
  },
});

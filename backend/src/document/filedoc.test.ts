import { assertEquals, assertRejects } from "std/assert";
import { DocFormatError, readDocFile } from "./filedoc.ts";
import { join as pathJoin } from "std/path";
import { getCurrentScriptDir } from "../util.ts";

function testdataPath(...paths: string[]) {
    return pathJoin(getCurrentScriptDir(import.meta), "testdata", ...paths);
}

Deno.test({
    name: "readDocFile",
    fn: async () => {
        const docPath = testdataPath("doc1.json");
        const doc = await readDocFile(docPath);
        assertEquals(doc.chunks.length, 3);
        assertEquals(doc.tags.length, 2);
    },
});

Deno.test({
    name: "readDocFile: not found",
    fn: async () => {
        const docPath = testdataPath("notfound");
        await assertRejects(
            async () => await readDocFile(docPath),
            Deno.errors.NotFound,
        );
    },
});

Deno.test({
    name: "readDocFile: invalid json",
    fn: async () => {
        const docPath = testdataPath("invalid.json");
        await assertRejects(
            async () => await readDocFile(docPath),
            DocFormatError,
        );
    },
});

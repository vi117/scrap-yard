import { assertEquals, assertRejects } from "std/assert";
import { DocFormatError, readDocFile, saveDocFile } from "./filedoc.ts";
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
        const invalidJsonFiles = [
            "invalid_chunks.json",
            "invalid_chunk.json",
            "invalid_tag.json",
            "invalid_version.json",
        ];
        for (const invalidJsonFile of invalidJsonFiles) {
            const docPath = testdataPath(invalidJsonFile);
            await assertRejects(
                async () => await readDocFile(docPath),
                DocFormatError,
            );
        }
    },
});

Deno.test({
    name: "saveDocFile",
    fn: async () => {
        const docPath = testdataPath("doc1.json");
        const doc = await readDocFile(docPath);
        const savedDocPath = pathJoin(
            await Deno.makeTempDir(),
            "saved_doc.json",
        );
        await saveDocFile(savedDocPath, doc);
        const savedDoc = await readDocFile(savedDocPath);
        assertEquals(savedDoc.chunks.length, 3);
        assertEquals(savedDoc.tags.length, 2);
    },
});

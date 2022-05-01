import { assertEquals } from "std/assert";
import { openFileDocument } from "./filedoc.ts";

Deno.test({
  name: "load check",
  fn: async () => {
    const doc = await openFileDocument("src/document/testdata/test.json");
    assertEquals(doc.chunks.map((x) => x.getContent()), [
      {
        "type": "text",
        "content": "foo",
      },
      {
        "type": "text",
        "content": "bar",
      },
      {
        "type": "text",
        "content": "baz",
      },
      {
        "type": "text",
        "content": "qux",
      },
      {
        "type": "markdown",
        "content": "**bold**",
      },
    ]);
  },
});

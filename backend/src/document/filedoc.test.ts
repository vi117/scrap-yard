import { assertEquals } from "std/assert";
import { createChunk } from "./chunk.ts";
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
    doc.chunks[0].insertBefore(createChunk({
      "type": "text",
      "content": "first",
    }));
    assertEquals(doc.chunks.map((x) => x.getContent()), [
      {
        "type": "text",
        "content": "first",
      },
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
    doc.chunks[2].remove();
    doc.chunks[2].remove();
    const ch = doc.chunks[2];
    doc.chunks[2].remove();
    assertEquals(doc.chunks.map((x) => x.getContent()), [
      {
        "type": "text",
        "content": "first",
      },
      {
        "type": "text",
        "content": "foo",
      },
      {
        "type": "markdown",
        "content": "**bold**",
      },
    ]);
    doc.chunks[0].insertAfter(ch);
    assertEquals(doc.chunks.map((x) => x.getContent()), [
      {
        "type": "text",
        "content": "first",
      },
      {
        "type": "text",
        "content": "qux",
      },
      {
        "type": "text",
        "content": "foo",
      },
      {
        "type": "markdown",
        "content": "**bold**",
      },
    ]);
  },
});

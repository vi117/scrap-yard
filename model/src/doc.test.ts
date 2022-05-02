import { assertEquals } from "../deps.ts";
import { CommonTextChunk, createChunk } from "./chunk.ts";
import { MockDocument } from "./mockdoc.ts";

Deno.test({
  name: "doc operation check",
  fn: () => {
    const doc = new MockDocument(
      "test.md",
      [
        {
          id: "1",
          "type": "text",
          "content": "foo",
        },
        {
          id: "2",
          "type": "text",
          "content": "bar",
        },
        {
          id: "3",
          "type": "text",
          "content": "baz",
        },
        {
          id: "4",
          "type": "text",
          "content": "qux",
        },
        {
          id: "5",
          "type": "markdown",
          "content": "**bold**",
        },
      ].map((x) => createChunk(x)),
    );
    doc.insertChunkBefore(
      doc.chunks[0],
      createChunk({
        "id": "6",
        "type": "text",
        "content": "first",
      }),
    );
    assertEquals(doc.chunks.map((x) => (x as CommonTextChunk).getContent()), [
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
    doc.removeChunk(doc.chunks[2]);
    doc.removeChunk(doc.chunks[2]);
    const ch = doc.chunks[2];
    doc.removeChunk(doc.chunks[2]);
    assertEquals(doc.chunks.map((x) => (x as CommonTextChunk).getContent()), [
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
    doc.insertChunkAfter(doc.chunks[0], ch);
    assertEquals(doc.chunks.map((x) => (x as CommonTextChunk).getContent()), [
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

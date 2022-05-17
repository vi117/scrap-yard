import * as setting from "./setting.ts";
import { assertEquals, assertRejects } from "std/assert";
import { stub } from "std/mock";
import { getCurrentScriptDir } from "./util.ts";
import { join as pathJoin } from "std/path";

const docPath = pathJoin(
  getCurrentScriptDir(import.meta),
  "testdata/test1_setting.json",
);

Deno.test({
  name: "setting: basic",
  fn: async () => {
    setting.setPath(docPath);
    setting.register("test", {
      type: "object",
      properties: {
        a: { type: "string" },
        b: { type: "number" },
      },
    });
    await setting.load();
    const data = setting.get<{ a: string; b: number }>("test");
    assertEquals(data, { a: "a", b: 1 });
    await assertRejects(async () => {
      await setting.get<{ a: string; b: number }>("test2");
    }, Error);
  },
});

Deno.test({
  name: "setting: default value",
  fn: async () => {
    setting.setPath(docPath);
    setting.register("test", {
      type: "object",
      properties: {
        a: { type: "string" },
        b: { type: "number" },
        c: { type: "boolean", default: true },
      },
    });
    await setting.load();
    const data = setting.get<{ a: string; b: number; c: boolean }>("test");
    assertEquals(data, { a: "a", b: 1, c: true });
  },
});

Deno.test({
  name: "setting: defered register",
  fn: async () => {
    const originalReadTextFile = Deno.readTextFile;
    const readTextFileStore = await stub(
      Deno,
      "readTextFile",
      async (path: string, options?: Deno.ReadFileOptions) => {
        if (path === docPath) {
          return JSON.stringify({
            test: {
              a: "a",
              b: 1,
              c: true,
            },
            test2: {
              a: "a",
              b: 1,
              c: true,
            },
          });
        } else {
          return await originalReadTextFile(path, options);
        }
      },
    );
    try {
      setting.setPath(docPath);
      setting.register("test", {
        type: "object",
        properties: {
          a: { type: "string" },
          b: { type: "number" },
          c: { type: "boolean", default: true },
        },
      });
      await setting.load();
      setting.register("test2", {
        type: "object",
        properties: {
          a: { type: "string" },
          b: { type: "number" },
          c: { type: "boolean", default: true },
        },
      });
      const data = setting.get<{ a: string; b: number; c: boolean }>("test2");
      assertEquals(data, { a: "a", b: 1, c: true });
    } finally {
      readTextFileStore.restore();
    }
  },
});

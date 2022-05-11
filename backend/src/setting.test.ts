import * as setting from "./setting.ts";
import { assertEquals, assertRejects } from "std/assert";

Deno.test({
  name: "setting: basic",
  fn: async () => {
    setting.setPath("src/testdata/test1_setting.json");
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

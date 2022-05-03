import { loadSetting, registerSetting } from "./setting.ts";
import { assertEquals, assertRejects } from "std/assert";
import { returnsNext, stub } from "std/mock";

Deno.test({
  name: "setting: basic",
  fn: async () => {
    const envStub = stub(
      Deno.env,
      "get",
      returnsNext([
        "src/testdata/test1_setting.json",
        "src/testdata/test1_setting.json",
      ]),
    );
    try {
      registerSetting("test", {
        type: "object",
        properties: {
          a: { type: "string" },
          b: { type: "number" },
        },
      });
      const data = await loadSetting<{ a: string; b: number }>("test");
      assertEquals(data, { a: "a", b: 1 });
      await assertRejects(async () => {
        await loadSetting<{ a: string; b: number }>("test2");
      }, Error);
    } finally {
      envStub.restore();
    }
  },
});

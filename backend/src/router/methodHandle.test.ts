import { assertEquals } from "std/assert";
import { MethodHandlerBuilber } from "./methodHandle.ts";

Deno.test({
  name: "methodHandle: basic methods",
  fn: async () => {
    const r = new MethodHandlerBuilber();
    const fn = (i: number) =>
      (_req: Request, _ctx: unknown) => {
        return new Response(i.toString(), {});
      };
    r.get(fn(1));
    r.post(fn(2));
    r.put(fn(3));
    r.delete(fn(4));

    const reqGen = (method: string) =>
      new Request("http://test.com/test.txt", { method: method });
    const ctx = {};

    const i = r.build();
    assertEquals(await (await i(reqGen("get"), ctx)).text(), "1");
    assertEquals(await (await i(reqGen("post"), ctx)).text(), "2");
    assertEquals(await (await i(reqGen("put"), ctx)).text(), "3");
    assertEquals(await (await i(reqGen("delete"), ctx)).text(), "4");
  },
});

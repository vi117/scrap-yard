import { assertEquals } from "std/assert";
import { MethodHandlerBuilber } from "./methodHandle.ts";
import { ResponseBuilder } from "./responseBuilder.ts";
import { Status } from "./util.ts";

const fn = (i: number) =>
    (_req: Request, _ctx: unknown) => {
        return new ResponseBuilder(i.toString());
    };
const reqGen = (method: string) =>
    new Request("http://test.com/test.txt", { method: method });

Deno.test({
    name: "methodHandle: basic methods",
    fn: async () => {
        const r = new MethodHandlerBuilber();
        r.get(fn(1));
        r.post(fn(2));
        r.put(fn(3));
        r.delete(fn(4));

        const ctx = {};

        const i = r.build();
        assertEquals(await (await i(reqGen("get"), ctx)).body, "1");
        assertEquals(await (await i(reqGen("post"), ctx)).body, "2");
        assertEquals(await (await i(reqGen("put"), ctx)).body, "3");
        assertEquals(await (await i(reqGen("delete"), ctx)).body, "4");
    },
});

Deno.test({
    name: "methodHandle: not found",
    fn: async () => {
        const r = new MethodHandlerBuilber();
        r.get(fn(1));

        const ctx = {};

        const i = r.build();
        assertEquals(
            (await i(reqGen("delete"), ctx)).status,
            Status.MethodNotAllowed,
        );
    },
});

Deno.test({
    name: "methodHandle: options",
    fn: async () => {
        const r = new MethodHandlerBuilber();
        r.get(fn(1));
        r.post(fn(2));

        const ctx = {};

        const i = r.build();
        const h = new Headers((await i(reqGen("options"), ctx)).headers);
        assertEquals(
            h.get("Allows")!,
            "get,post",
        );
    },
});

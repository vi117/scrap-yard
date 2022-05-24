import { TreeRouter } from "./route.ts";
import { assertEquals } from "std/assert";

Deno.test({
    name: "route: basic route",
    fn: () => {
        const r = new TreeRouter<number>();

        r.register("/", 1);
        r.register("/users", 2);
        let i = r.match("/");
        assertEquals(i, 1);
        i = r.match("/");
        assertEquals(i, 1);
        i = r.match("/users");
        assertEquals(i, 2);
    },
});

Deno.test({
    name: "route: double slash route",
    fn: () => {
        const r = new TreeRouter<number>();

        r.register("//", 1);
        const i = r.match("/");
        assertEquals(i, 1);
    },
});

Deno.test({
    name: "route: double match",
    fn: () => {
        const r = new TreeRouter<number>();

        r.register("/", 1);
        let i = r.match("/");
        assertEquals(i, 1);
        r.register("/", 2);
        i = r.match("/");
        assertEquals(i, 2);
    },
});

Deno.test({
    name: "route: test context",
    fn: () => {
        const r = new TreeRouter<number>();
        r.register("/users/:name", 3);
        const ctx: Record<string, string> = {};
        const i = r.match("/users/jonh", ctx);

        assertEquals(i, 3);
        assertEquals(ctx, { "name": "jonh" });
    },
});

Deno.test({
    name: "route: test regex",
    fn: () => {
        const r = new TreeRouter<number>();
        r.register("/users/:id(\\d)", 3);
        const ctx: Record<string, string> = {};
        const i = r.match("/users/3", ctx);

        assertEquals(i, 3);
        assertEquals(ctx["id"], "3");
    },
});

Deno.test({
    name: "route: test not found",
    fn: () => {
        const r = new TreeRouter<number>();
        r.register("/", 1);
        r.register("/users", 2);
        r.register("/users/:id(\\d)", 3);
        assertEquals(r.match("/users/jonh"), null);
        assertEquals(r.match("/a"), null);
    },
});

Deno.test({
    name: "route: encode_route",
    fn: () => {
        const r = new TreeRouter<number>();

        r.register("/", 1);
        r.register("/이용자", 2);
        r.register("/이용자/:name", 3);
        let i = r.match("/");
        assertEquals(i, 1);
        i = r.match("/");
        assertEquals(i, 1);
        const ctx = { name: "" };
        i = r.match(
            "/%EC%9D%B4%EC%9A%A9%EC%9E%90/%ED%99%8D%EA%B8%B8%EB%8F%99",
            ctx,
        );
        assertEquals(i, 3);
        assertEquals(ctx.name, "홍길동");
    },
});

Deno.test({
    name: "route: router in router",
    fn: () => {
        const r = new TreeRouter<number>();
        const r2 = new TreeRouter<number>();
        r.register("/", 1);
        r.register("/users", 2);
        r.register("/users/:id(\\d)", 3);
        r2.register("/", 4);
        r2.register("/:post", 5);
        r2.register("/:post/comment", 6);
        r.registerRouter("/users/:id(\\d)/", r2);
        let i = r.match("/users/3");
        assertEquals(i, 3);
        i = r.match("/users/3/post1");
        assertEquals(i, 5);
        i = r.match("/users/3/post1/comment");
        assertEquals(i, 6);
    },
});

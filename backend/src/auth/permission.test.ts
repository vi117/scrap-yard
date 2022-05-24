import { assertEquals } from "std/assert";
import { createPermission } from "./permission.ts";

Deno.test({
    name: "permission.test",
    fn() {
        const permission = createPermission("test");

        assertEquals(permission.canRead("test/"), true);
        assertEquals(permission.canRead("test/test.txt"), true);
        assertEquals(permission.canRead("test/test/"), true);
        assertEquals(permission.canRead("test/test/test.txt"), true);
        assertEquals(permission.canRead("foo"), false);
        assertEquals(permission.canRead("foo/test.txt"), false);

        assertEquals(permission.canWrite("test/"), false);
        assertEquals(permission.canWrite("test/test.txt"), false);
        assertEquals(permission.canWrite("test/test/"), false);

        assertEquals(permission.canCustom("test/", {}), false);

        const permission2 = createPermission("test/", { writable: true });

        assertEquals(permission2.canRead("test/"), true);
        assertEquals(permission2.canRead("test/test.txt"), true);
        assertEquals(permission2.canRead("test/test/"), true);

        assertEquals(permission2.canWrite("test/"), true);
        assertEquals(permission2.canWrite("test/test.txt"), true);
        assertEquals(permission2.canWrite("test/test/"), true);
        assertEquals(permission2.canWrite("foo"), false);

        assertEquals(permission2.canCustom("test/", {}), false);
    },
});

Deno.test({
    name: "permission empty",
    fn() {
        const permission = createPermission("");

        assertEquals(permission.canRead("test/"), true);
        assertEquals(permission.canRead("test/test.txt"), true);
        assertEquals(permission.canRead("test/test/"), true);
        assertEquals(permission.canRead("test/test/test.txt"), true);
        assertEquals(permission.canRead("foo"), true);
        assertEquals(permission.canRead("foo/test.txt"), true);
    },
});

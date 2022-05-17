import { createAdminUser, IUser } from "./user.ts";
import { assertEquals } from "std/assert";

Deno.test({
  name: "user.createAdminUser",
  fn: () => {
    const user = createAdminUser("admin");
    user.expiredAfter(1000);
    assertEquals(user.isExpired(), false);
    assertEquals(user.id, "admin");
    assertEquals(user.canRead("."), true);
    assertEquals(user.canWrite("."), true);
    assertEquals(user.canCustom(".", { writable: true }), true);
  },
});

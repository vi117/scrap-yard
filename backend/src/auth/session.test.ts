import {
    handleLogin,
    handleLogout,
    makeSessionId,
    SessionStore,
} from "./session.ts";
import { createAdminUser, IUser } from "./user.ts";
import { assertEquals, assertNotEquals } from "std/assert";

Deno.test({
    name: "Session",
    fn: async (t) => {
        const session = new SessionStore<IUser>();
        const id = makeSessionId();

        await t.step("set", () => {
            session.set(id, createAdminUser(id));
            assertNotEquals(session.get(id), undefined);
        });

        await t.step("delete", () => {
            session.delete(id);
            assertEquals(session.get(id), undefined);
        });
    },
});

Deno.test({
    name: "Login Handler",
    fn: async (t) => {
        const password = Deno.env.get("SESSION_PASSWORD") || "secret";
        let uuid: string | undefined;

        await t.step("login", async () => {
            const body = JSON.stringify({
                password,
            });
            const res = await handleLogin(
                new Request("http://test.com/test.txt", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body,
                }),
            );
            assertEquals(res.status, 200);
            const cookies = res.headers.get("Set-Cookie");
            assertNotEquals(cookies, undefined);
            uuid = cookies?.split(";")[0].split("=")[1];
        });

        await t.step("logout", async () => {
            const res = await handleLogout(
                new Request("http://test.com/test.txt", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Set-Cookie": `session=${uuid}; path=/`,
                    },
                }),
            );
            assertEquals(res.status, 200);
        });
    },
});

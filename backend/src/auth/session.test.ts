import {
    getAuthHandler,
    getSession,
    makeSessionId,
    SessionStore,
} from "./session.ts";
import { createAdminUser, IUser } from "./user.ts";
import { assert, assertEquals, assertNotEquals } from "std/assert";

const PASSWORD = "secret";
const { handleLogin, handleLogout } = getAuthHandler({ "password": PASSWORD });

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

function makeJSONRequest(headers: Record<string, string> = {}, body = "") {
    return new Request("http://test.com/test.txt", {
        method: "POST",
        headers: {
            ...headers,
            "content-type": "application/json",
        },
        body,
    });
}

Deno.test({
    name: "Login Handler",
    fn: async (t) => {
        let uuid: string | undefined;

        await t.step("login with invalid format", async () => {
            const body = JSON.stringify({});
            const res = await handleLogin(
                makeJSONRequest({}, body),
            );
            assertEquals(res.status, 400);
        });

        await t.step("login with invalid password", async () => {
            const body = JSON.stringify({
                password: "no such password" + PASSWORD,
            });
            const res = await handleLogin(
                makeJSONRequest({}, body),
            );
            assertEquals(res.status, 401);
        });

        await t.step("login", async () => {
            const body = JSON.stringify({
                PASSWORD,
            });
            const res = await handleLogin(
                makeJSONRequest({}, body),
            );
            assertEquals(res.status, 200);
            const cookies = res.headers.get("Set-Cookie");
            assert(cookies !== null, "no cookies");
            uuid = cookies.split(";")[0].split("=")[1];
        });

        await t.step("logout with no session", async () => {
            const res = await handleLogout(
                makeJSONRequest({}),
            );
            assertEquals(res.status, 400);
        });

        await t.step("logout", async () => {
            const res = await handleLogout(
                makeJSONRequest({
                    cookie: `session=${uuid}; path=/`,
                }),
            );
            assertEquals(res.status, 200);
        });
    },
});

Deno.test({
    name: "getSession",
    fn: async () => {
        const body = JSON.stringify({
            PASSWORD,
        });
        const res = await handleLogin(
            makeJSONRequest({}, body),
        );
        assertEquals(res.status, 200);
        const cookies = res.headers.get("Set-Cookie");
        assert(cookies !== null, "no cookies");
        const uuid = cookies.split(";")[0].split("=")[1];
        const user = getSession(
            makeJSONRequest({ cookie: `session=${uuid}; path=/` }),
        );
        assert(user !== undefined, "no user");
        assertEquals(user.id, uuid);
    },
});

Deno.test({
    name: "getSession with invalid cookie",
    fn: () => {
        const user = getSession(
            makeJSONRequest({ cookie: "session=no-such-cookie; path=/" }),
        );
        assert(user === undefined, "user should be undefined");
    },
});

import { makeResponse } from "../router/util.ts";
import { createAdminUser, IUser } from "./user.ts";
import * as setting from "../setting.ts";
import { getCookies, setCookie } from "std/http";

export class SessionStore<T> {
    sessions: Record<string, T>;
    constructor() {
        this.sessions = {};
    }
    get(id: string): T | undefined {
        return this.sessions[id];
    }
    set(id: string, value: T): void {
        this.sessions[id] = value;
    }
    delete(id: string): void {
        delete this.sessions[id];
    }
    async saveToFile(path: string): Promise<void> {
        await Deno.writeTextFile(path, JSON.stringify(this.sessions));
    }
    async loadFromFile(path: string): Promise<void> {
        const data = await Deno.readTextFile(path);
        this.sessions = JSON.parse(data);
    }
}

const password = Deno.env.get("SESSION_PASSWORD") || "secret";
export const sessionStore = new SessionStore<IUser>();

export function makeSessionId(): string {
    return crypto.randomUUID();
}

export async function handleLogin(req: Request): Promise<Response> {
    const body = await (req.text());
    const data = JSON.parse(body);
    if (!("password" in data)) {
        return makeResponse(
            400,
            JSON.stringify({
                ok: false,
                reason: "password required",
            }),
        );
    }
    const { password: p } = data;
    if (p !== password) {
        return makeResponse(
            401,
            JSON.stringify({
                ok: false,
                reason: "password incorrect",
            }),
        );
    }
    const id = makeSessionId();
    sessionStore.set(id, createAdminUser(id));
    const res = new Response('{"ok":true}', {
        status: 200,
        statusText: "OK",
    });
    setCookie(res.headers, {
        name: "session",
        value: id,
        secure: true,
    });
    return res;
}

export function handleLogout(req: Request): Response {
    const id = getSessionId(req);
    if (!id) {
        return makeResponse(
            400,
            JSON.stringify({
                ok: false,
                reason: "no session id",
            }),
        );
    }
    sessionStore.delete(id);
    return makeResponse(
        200,
        JSON.stringify({
            ok: true,
        }),
    );
}

export function getSessionId(req: Request): string | undefined {
    const cookies = getCookies(req.headers);
    if (!cookies.session) {
        return undefined;
    }
    return cookies.session;
}

export function getSession(req: Request): IUser | undefined {
    const id = getSessionId(req);
    if (!id) {
        return undefined;
    }
    return sessionStore.get(id);
}

type SessionSetting = {
    allowAnonymous: boolean;
};

setting.register("session", {
    type: "object",
    properties: {
        allowAnonymous: { type: "boolean", default: true },
    },
});

export function getAllowAnonymous(): boolean {
    return setting.get<SessionSetting>("session").allowAnonymous;
}

export function getSessionUser(req: Request): IUser {
    const session = getSession(req);
    if (!session) {
        if (!getAllowAnonymous()) {
            throw new Error("no session");
        }
        //TODO(vi117): create anonymous user. not admin user
        return createAdminUser("default");
    }
    return session;
}

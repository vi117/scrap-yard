import { makeJsonResponse, Status } from "../router/util.ts";
import { createAdminUser, IUser } from "./user.ts";
import { getCookies, setCookie } from "std/http";
import { ResponseBuilder } from "../router/mod.ts";
import {
    AtomicReadWriter,
    IReadWriter,
    QueueReadWriter,
} from "../watcher/mod.ts";
import * as log from "std/log";
import { serializedReviver } from "../serializer.ts";

export class SessionStore<T> extends EventTarget {
    sessions: Record<string, T>;

    constructor() {
        super();
        this.sessions = {};
    }
    get(id: string): T | undefined {
        return this.sessions[id];
    }
    set(id: string, value: T): void {
        this.sessions[id] = value;
        this.dispatchEvent(new CustomEvent("set", { detail: { id, value } }));
    }
    delete(id: string): void {
        delete this.sessions[id];
        this.dispatchEvent(new CustomEvent("delete", { detail: { id } }));
    }
    toJSON() {
        return this.sessions;
    }
    load(json: Record<string, T>): void {
        this.sessions = {
            ...this.sessions,
            ...json,
        };
    }
}

export const sessionStore = new SessionStore<IUser>();

export function makeSessionId(): string {
    return crypto.randomUUID();
}

interface setSessionCookieOption {
    id: string;
    domain: string;
    expiredAt: number;
}

function setSessionCookie(headers: Headers, {
    id,
    domain,
    expiredAt,
}: setSessionCookieOption) {
    setCookie(headers, {
        name: "session",
        value: id,
        secure: false,
        httpOnly: true,
        expires: new Date(expiredAt),
        domain: domain,
        path: "/",
        sameSite: "Strict",
    });
}

interface getAuthHandlerOption {
    password: string;
    secret: string;
    sessionPath: string;
    rw?: IReadWriter;
}

export async function getAuthHandler(options: getAuthHandlerOption) {
    const password = options.password;
    const rw = options.rw ?? new QueueReadWriter(10, new AtomicReadWriter());
    const sessionPath = options.sessionPath;

    let loaded: string;
    try {
        loaded = await rw.read(sessionPath);
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
            log.info("session file not found");
            await rw.write(sessionPath, "{}");
        } else {
            log.error(e);
            throw e;
        }
        loaded = "{}";
    }
    sessionStore.load(JSON.parse(loaded, serializedReviver));
    sessionStore.addEventListener("set", () => {
        rw.write(sessionPath, JSON.stringify(sessionStore, undefined, 2));
    });
    sessionStore.addEventListener("delete", () => {
        rw.write(sessionPath, JSON.stringify(sessionStore, undefined, 2));
    });

    return { handleLogin, handleLogout };

    async function handleLogin(req: Request): Promise<ResponseBuilder> {
        const body = await (req.text());
        const data = JSON.parse(body);
        const url = new URL(req.url);
        if ("password" in data && typeof data.password === "string") {
            const { password: p } = data;
            if (p !== password) {
                return makeJsonResponse(
                    Status.Unauthorized,
                    {
                        ok: false,
                        reason: "password incorrect",
                    },
                );
            }
            const id = options.secret;
            const user = createAdminUser(id);
            sessionStore.set(id, user);
            const res = makeJsonResponse(Status.OK, { ok: true });
            setSessionCookie(res.headers, {
                id: id,
                domain: url.hostname,
                expiredAt: user.expiredAt,
            });
            return res;
        } else if ("token" in data && typeof data.token === "string") {
            const { token: t } = data;
            const user = sessionStore.get(t);
            if (!user) {
                return makeJsonResponse(Status.Unauthorized, {
                    ok: false,
                    reason: "token incorrect",
                });
            }
            const res = makeJsonResponse(Status.OK, {});
            setSessionCookie(res.headers, {
                id: t,
                domain: url.hostname,
                expiredAt: user.expiredAt,
            });
            return res;
        } else {
            return makeJsonResponse(
                Status.BadRequest,
                {
                    ok: false,
                    reason: "password or token required",
                },
            );
        }
    }

    function handleLogout(req: Request): ResponseBuilder {
        const id = getSessionId(req);
        const url = new URL(req.url);
        if (!id) {
            return makeJsonResponse(
                Status.BadRequest,
                {
                    ok: false,
                    reason: "no session id",
                },
            );
        }
        const res = makeJsonResponse(
            200,
            {
                ok: true,
            },
        );
        setSessionCookie(res.headers, {
            domain: url.hostname,
            id: "",
            expiredAt: 0,
        });
        return res;
    }
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

let allowAnonymous = false;
export function setAllowAnonymous(value: boolean) {
    allowAnonymous = value;
}
export function getAllowAnonymous(): boolean {
    return allowAnonymous;
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

export function handleGetSessionUserInfo(req: Request) {
    const session = getSession(req);
    if (!session) {
        return makeJsonResponse(Status.OK, {
            login: false,
        });
    } else {
        return makeJsonResponse(Status.OK, {
            login: true,
            expiredAt: session.expiredAt,
        });
    }
}

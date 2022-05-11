import { makeResponse } from "../router/util.ts";
import { createAdminUser, UserSession } from "./user.ts";
import * as setting from "../setting.ts";

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
export const sessionStore = new SessionStore<UserSession>();

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
  return new Response('{"ok":true}', {
    status: 200,
    statusText: "OK",
    headers: {
      "Set-Cookie": `session=${id}; path=/`,
    },
  });
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
  const cookies = req.headers.get("Set-Cookie");
  if (!cookies) {
    return undefined;
  }
  const id = cookies.split(";")[0].split("=")[1];
  return id;
}

export function getSession(req: Request): UserSession | undefined {
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

export function getSessionUser(req: Request): UserSession {
  const session = getSession(req);
  if (!session) {
    if (!setting.get<SessionSetting>("session").allowAnonymous) {
      throw new Error("no session");
    }
    return createAdminUser("default");
  }
  return session;
}

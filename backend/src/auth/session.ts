import { makeResponse } from "../router/util.ts";
import { createAdminUser, UserSession } from "./user.ts";

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
}

const password = Deno.env.get("SESSION_PASSWORD") || "secret";
const session = new SessionStore<UserSession>();

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
  session.set(id, createAdminUser(id));
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
  session.delete(id);
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
  return session.get(id);
}

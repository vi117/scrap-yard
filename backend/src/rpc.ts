import { makeResponse, Status } from "./router/util.ts";
import { Connection, registerParticipant } from "./rpc/connection.ts";
import { IdGenerator } from "./util.ts";
import { getSessionUser } from "./auth/session.ts";
import * as log from "std/log";

const idGen = new IdGenerator();

export function rpc(req: Request, _ctx: unknown): Response {
  if (req.headers.get("Upgrade") !== "websocket") {
    return makeResponse(Status.BadRequest, "Not websocket request");
  }
  const user = getSessionUser(req);
  const { socket, response } = Deno.upgradeWebSocket(req);
  const conn = new Connection(idGen.next().toString(), user, socket);
  registerParticipant(conn);
  // debug

  conn.addEventListener("open", () => {
    log.info(`${conn.id} connected`);
  });
  conn.addEventListener("message", (e) => {
    log.debug(`${conn.id} on message: ${e.data}`);
  });
  conn.addEventListener("error", (e) => {
    log.error(`${conn.id} error: ${e.type}`);
  });
  conn.addEventListener("close", (e) => {
    log.info(`${conn.id} closed: ${e.code} ${e.reason}`);
  });
  return response;
}

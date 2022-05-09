import { makeResponse, Status } from "./router/util.ts";
import { AllParticipants, Connection } from "./rpc/connection.ts";
import { handleMethodOnMessage } from "./rpc/rpc.ts";
import * as log from "std/log";

// it is temporary id generator. it will be replaced with real id.
let idGen = 0;

export function rpc(req: Request, _ctx: unknown): Response {
  if (req.headers.get("Upgrade") !== "websocket") {
    return makeResponse(Status.BadRequest);
  }
  const { socket, response } = Deno.upgradeWebSocket(req);
  idGen++;
  const conn = new Connection(idGen.toString(), socket);
  conn.addEventListener("open",()=>{
    log.info(`${conn.id} connected`);
    AllParticipants.add(conn.id, conn);
  });
  conn.addEventListener("message", (e) => {
    log.debug(`${conn.id} on message: ${e.data}`);
    handleMethodOnMessage(conn, e.data);
  });
  conn.addEventListener("error",(e)=>{
    log.error(`${conn.id} error: ${e.type}`);
  })
  conn.addEventListener("close",(e)=>{
    log.info(`${conn.id} closed: ${e.code} ${e.reason}`);
    AllParticipants.remove(conn.id);
  });
  return response;
}

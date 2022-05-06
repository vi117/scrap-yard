import { makeResponse, Status } from "./router/util.ts";
import { AllParticipants, Connection } from "./rpc/connection.ts";
import { handleMethodOnMessage } from "./rpc/rpc.ts";
import * as log from "std/log";

export class JsonRPCHandler {
  socket: WebSocket;
  conn: Connection;
  constructor(id: string, socket: WebSocket) {
    this.socket = socket;
    this.conn = new Connection(id, this.socket);
    socket.onopen = () => {
      this.initialize();
    };
    socket.onmessage = (e) => {
      this.onMessage(e.data);
    };
    socket.onclose = (e) => {
      this.onClose(e);
    };
    socket.onerror = (e) => {
      this.onError(e);
    };
  }
  initialize() {
    log.info(`${this.conn.id} connected`);
    AllParticipants.add(this.conn.id, this.conn);
  }
  onMessage(message: string) {
    log.debug(`${this.conn.id} on message: ${message}`);
    handleMethodOnMessage(this.conn, message);
  }
  onError(error: ErrorEvent | Event) {
    log.error(`${this.conn.id} error: ${error.type}`);
  }
  onClose(_event: CloseEvent) {
    log.info(`${this.conn.id} closed`);
    AllParticipants.remove(this.conn.id);
  }
}

// it is temporary id generator. it will be replaced with real id.
let idGen = 0;

export function rpc(req: Request, _ctx: unknown): Response {
  if (req.headers.get("Upgrade") !== "websocket") {
    return makeResponse(Status.BadRequest);
  }
  const { socket, response } = Deno.upgradeWebSocket(req);
  idGen++;
  new JsonRPCHandler(idGen.toString(), socket);
  return response;
}

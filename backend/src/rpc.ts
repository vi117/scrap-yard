import { makeResponse, Status } from "./router/util.ts";
import { AllParticipants, Connection } from "./rpc/connection.ts";
import { handleMethodOnMessage } from "./rpc/rpc.ts";
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
    console.log(`${this.conn.id} connected`);
    AllParticipants.add(this.conn.id, this.conn);
  }
  onMessage(message: string) {
    handleMethodOnMessage(this.conn, message);
  }
  onError(_error: ErrorEvent | Event) {
  }
  onClose(_event: CloseEvent) {
    console.log(`${this.conn.id} closed`);
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

import { makeResponse, Status } from "./router/util.ts";

export class JsonRPCHandler {
  socket: WebSocket;

  constructor(socket: WebSocket) {
    this.socket = socket;
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
  initialize() {}
  onMessage(_message: string) {
  }
  onError(_error: ErrorEvent | Event) {
  }
  onClose(_event: CloseEvent) {}
}

export function rpc(req: Request, _ctx: unknown): Response {
  if (req.headers.get("Upgrade") !== "websocket") {
    return makeResponse(Status.BadRequest);
  }
  const { socket, response } = Deno.upgradeWebSocket(req);
  new JsonRPCHandler(socket);
  return response;
}

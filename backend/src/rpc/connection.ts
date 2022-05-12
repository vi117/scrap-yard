import { UserSession } from "../auth/user.ts";
import { handleMethodOnMessage } from "./rpc.ts";

export interface Participant {
  readonly id: string;
  readonly user: UserSession;

  // TODO(vi117): replace `send` to `sendNotification` and `respondWith`
  send(data: string): void;

  addEventListener<T extends keyof WebSocketEventMap>(
    type: T,
    listener: (this: WebSocket, event: WebSocketEventMap[T]) => void,
  ): void;
  removeEventListener<T extends keyof WebSocketEventMap>(
    type: T,
    listener: (this: WebSocket, event: WebSocketEventMap[T]) => void,
  ): void;
  close(): void;
}

export class Connection implements Participant {
  id: string;
  user: UserSession;
  socket: WebSocket;
  constructor(id: string, user: UserSession, socket: WebSocket) {
    this.id = id;
    this.user = user;
    this.socket = socket;
  }

  send(data: string): void {
    this.socket.send(data);
  }

  addEventListener<T extends keyof WebSocketEventMap>(
    type: T,
    listener: (this: WebSocket, event: WebSocketEventMap[T]) => void,
  ): void {
    this.socket.addEventListener(type, listener);
  }

  removeEventListener<T extends keyof WebSocketEventMap>(
    type: T,
    listener: (this: WebSocket, event: WebSocketEventMap[T]) => void,
  ): void {
    this.socket.removeEventListener(type, listener);
  }

  close(code?: number, reason?: string): void {
    this.socket.close(code, reason);
  }
}

export class ParticipantList {
  connections: Map<string, Participant>;
  constructor() {
    this.connections = new Map();
  }
  add(id: string, p: Participant) {
    this.connections.set(id, p);
  }
  get(id: string) {
    return this.connections.get(id);
  }
  remove(id: string) {
    this.connections.delete(id);
  }
  unicast(id: string, message: string) {
    const connection = this.get(id);
    if (connection) {
      connection.send(message);
    }
  }
  broadcast(message: string) {
    for (const connection of this.connections.values()) {
      connection.send(message);
    }
  }
}

export const AllParticipants = new ParticipantList();

export function registerParticipant(p: Connection) {
  p.addEventListener("open", () => {
    AllParticipants.add(p.id, p);
  });
  p.addEventListener("close", () => {
    AllParticipants.remove(p.id);
  });
  p.addEventListener("message", (e) => {
    handleMethodOnMessage(p, e.data);
  });
}

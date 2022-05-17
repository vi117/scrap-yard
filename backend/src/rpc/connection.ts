import { IUser } from "../auth/user.ts";
import { handleMethodOnMessage } from "./rpc.ts";
import * as RPC from "model";
import * as log from "std/log";

export interface Participant {
  readonly id: string;
  readonly user: IUser;

  // TODO(vi117): remove `send` and replace to `sendNotification` and `respondWith`
  send(data: string): void;

  sendNotification(notification: RPC.RPCNotification): void;

  responseWith(data: RPC.RPCResponse): void;

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
  user: IUser;
  socket: WebSocket;
  constructor(id: string, user: IUser, socket: WebSocket) {
    this.id = id;
    this.user = user;
    this.socket = socket;
  }

  sendNotification(notification: RPC.RPCNotification): void {
    this.send(JSON.stringify(notification));
  }

  responseWith(res: RPC.RPCResponse): void {
    const json = JSON.stringify(res);
    log.debug(`Sending response: ${json}`);
    this.send(json);
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
  unicastNotification(id: string, notification: RPC.RPCNotification) {
    const connection = this.get(id);
    if (connection) {
      connection.sendNotification(notification);
    }
  }
  broadcastNotification(notification: RPC.RPCNotification) {
    for (const connection of this.connections.values()) {
      connection.sendNotification(notification);
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

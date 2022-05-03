import { EventEmitter } from "https://deno.land/std@0.137.0/node/events.ts";

interface ParticipantEventListener {
  "close": (event: CloseEvent) => void;
}

export interface Participant {
  id: string;
  send(data: string): void;
  on(type: "close", listener: ParticipantEventListener["close"]): this;
  off(type: "close", listener: ParticipantEventListener["close"]): this;
  emit(type: keyof ParticipantEventListener, event: CloseEvent): boolean;
  close(): void;
}

export class Connection extends EventEmitter implements Participant {
  id: string;
  socket: WebSocket;
  constructor(id: string, socket: WebSocket) {
    super();
    this.id = id;
    this.socket = socket;
  }
  on(_type: "close", listener: (event: CloseEvent) => void): this {
    super.on("close", listener);
    return this;
  }
  off(_type: "close", listener: (event: CloseEvent) => void): this {
    super.off("close", listener);
    return this;
  }
  emit(_type: "close", event: CloseEvent): boolean {
    return super.emit("close", event);
  }

  send(data: string): void {
    this.socket.send(data);
  }
  close(): void {
    this.socket.close();
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

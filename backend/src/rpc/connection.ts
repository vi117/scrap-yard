export interface Participant {
  id: string;
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
  socket: WebSocket;
  constructor(id: string, socket: WebSocket) {
    this.id = id;
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

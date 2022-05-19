import { Participant } from "./connection.ts";
import { ChunkNotificationParam } from "model";
import * as RPC from "model";
import * as log from "std/log";
import { ChunkMethodHistory } from "./chunk.ts";
import * as setting from "../setting.ts";
import { readDocFile } from "../document/filedoc.ts";
import { DocFileReadWriter, DocReadWriter } from "../document/mod.ts";

export type DocHistory = {
  time: number;
  method: ChunkMethodHistory;
};

type DocStoreSetting = {
  docHistoryLength: number;
};

setting.register("docStore", {
  type: "object",
  properties: {
    docHitoryLength: {
      type: "number",
      default: 10,
      minimum: 1,
      maximum: 100,
      title: "History Length",
      description: "The number of historys to keep",
    },
  },
});

/**
 * get the maximum number of historys to keep
 * must be called after setting is loaded
 * @returns The number of historys to keep
 */
export function getSettingDocHistoryMaximum(): number {
  return setting.get<DocStoreSetting>("docStore").docHistoryLength;
}

export interface ISubscriptable {
  join(participant: Participant): void;
  leave(participant: Participant): void;
  broadcastChunkMethod(
    method: ChunkNotificationParam,
    updatedAt: number,
    exclude?: Participant,
  ): void;
  readonly participantsCount: number;
  readonly participants: Participant[];
}

/**
 * A active document.
 *  each `conn` manages a staleness of the document.
 */
//TODO(vi117)
//Optimize this class.
export class ActiveDocumentObject
  implements RPC.DocumentObject, ISubscriptable {
  private conns: Set<Participant>;

  history: DocHistory[];
  readonly maxHistory: number;
  readonly docPath: string;
  chunks: RPC.Chunk[];
  updatedAt: number;
  seq: number;
  #tags: string[];
  tagsUpdatedAt: number;

  readWriter: DocReadWriter;

  constructor(docPath: string, maxHistory: number, readWriter?: DocReadWriter) {
    this.docPath = docPath;
    this.conns = new Set();
    this.history = [];
    this.maxHistory = maxHistory;
    this.chunks = [];
    this.updatedAt = 0;
    this.seq = 0;
    this.#tags = [];
    this.tagsUpdatedAt = 0;
    this.readWriter = readWriter ?? DocFileReadWriter;
  }

  async save() {
    await this.readWriter.save(this.docPath, {
      chunks: this.chunks,
      tags: this.tags,
      version: 1,
    });
  }

  /**
   * set tags of the document
   * @param tags tags to be applied
   */
  setTags(tags: string[]) {
    this.#tags = tags;
    this.tagsUpdatedAt = Date.now();
  }
  get tags(): string[] {
    return this.#tags;
  }

  get participantsCount() {
    return this.conns.size;
  }
  get participants(): Participant[] {
    return [...this.conns.values()];
  }

  join(conn: Participant) {
    this.conns.add(conn);
    conn.addEventListener("close", () => {
      log.warning(`connection ${conn.id} closed`);
      this.leave(conn);
    });
  }

  //TODO(vi117): release the handler
  leave(conn: Participant) {
    this.conns.delete(conn);
  }

  async open(): Promise<void> {
    const doc = await readDocFile(this.docPath);
    this.chunks = doc.chunks;
    const updatedAt = Date.now();
    this.updatedAt = updatedAt;
    this.seq = 0;
    this.#tags = doc.tags;
    this.tagsUpdatedAt = updatedAt;
  }

  updateDocHistory(method: ChunkMethodHistory) {
    const now = Date.now();
    this.history.push({
      time: now,
      method: method,
    });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.seq++;
    this.updatedAt = now;
  }
  /**
   * broadcast update to all connections
   * @param method chunk method to be applied
   * @param updatedAt the time when method executed
   * @param exclude the connection that should not be notified. e.g. the connection that executed the method
   */
  broadcastChunkMethod(
    method: ChunkNotificationParam,
    updatedAt: number,
    exclude?: Participant,
  ) {
    for (const conn of this.conns) {
      if (conn !== exclude) {
        const notification: RPC.RPCNotification = {
          jsonrpc: "2.0",
          method: "chunk.update",
          params: {
            method,
            updatedAt,
            docPath: conn.user.relativePath(this.docPath),
            seq: this.seq,
          },
        };
        conn.send(JSON.stringify(notification));
      }
    }
  }
  broadcastTagsNotification(
    exclude?: Participant,
  ) {
    for (const conn of this.conns) {
      if (conn !== exclude) {
        const notify: RPC.DocumentTagNotification = {
          jsonrpc: "2.0",
          method: "document.tags",
          params: {
            tags: this.tags,
            updatedAt: this.tagsUpdatedAt,
            docPath: conn.user.relativePath(this.docPath),
          },
        };
        conn.send(JSON.stringify(notify));
      }
    }
  }
}

export class DocumentStore {
  documents: { [key: string]: ActiveDocumentObject } = {};
  constructor() {
    this.documents = {};
  }

  async open(conn: Participant, docPath: string) {
    const docGroup = this.documents[docPath];
    if (!docGroup) {
      const maxHistoryLimit = getSettingDocHistoryMaximum();
      //TODO(vi117): use a factory to create docGroup
      const doc = new ActiveDocumentObject(docPath, maxHistoryLimit);
      await doc.open();
      doc.join(conn);
      this.documents[docPath] = doc;
      return doc;
    }
    docGroup.join(conn);
    return docGroup;
  }
  close(conn: Participant, docPath: string) {
    const docGroup = this.documents[docPath];
    if (!docGroup) {
      return;
    }
    docGroup.leave(conn);
    if (docGroup.participantsCount === 0) {
      delete this.documents[docPath];
    }
  }
  /**
   * close all documents opened by the user
   * @param userId
   */
  closeAll(conn: Participant) {
    // There aren't many users, so it's simple to handle regardless of efficiency.
    for (const docPath in this.documents) {
      this.close(conn, docPath);
    }
  }
}

export const DocStore = new DocumentStore();

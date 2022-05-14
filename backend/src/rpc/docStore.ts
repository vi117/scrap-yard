import { FileDocumentObject } from "../document/filedoc.ts";
import { Participant } from "./connection.ts";
import { ChunkMethod, ChunkNotificationParam } from "model";
import * as RPC from "model";
import * as log from "std/log";
import { ChunkMethodHistory } from "./chunk.ts";
import * as setting from "../setting.ts";

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

/**
 * A active document.
 *  each `conn` manages a staleness of the document.
 */
//TODO(vi117)
//Optimize this class.
//Inheriting FileDocumentObject is not a good idea.
//Consider to compose FileDocumentObject.
export class ActiveDocumentObject extends FileDocumentObject {
  conns: Set<Participant>;
  history: DocHistory[];
  readonly maxHistory: number;

  constructor(docPath: string, maxHistory: number) {
    super(docPath);
    this.conns = new Set();
    this.history = [];
    this.maxHistory = maxHistory;
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
  broadcastMethod(
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
            docPath: this.docPath,
            seq: this.seq,
          },
        };
        conn.send(JSON.stringify(notification));
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
      doc.conns.add(conn);
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
    if (docGroup.conns.size === 0) {
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

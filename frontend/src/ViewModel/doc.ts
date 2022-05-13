import { Chunk, ChunkContent, ChunkContentKind, ChunkNotification, DocumentObject } from "model";
import { useEffect, useState } from "react";
import * as stl from "tstl";
import { v4 as uuidv4 } from "uuid";
import { chunkCreate, chunkDelete, chunkModify, chunkMove } from "../Model/chunk";
import { openDocument } from "../Model/Document";
import { RPCManager as manager, RPCNotificationEvent } from "../Model/RPCManager";
import { IPageViewModel } from "./page";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IDocumentViewModel extends IPageViewModel {
  updateOnNotification(notification: ChunkNotification): void;
}

interface ChunkListMutator {
  /**
   * add chunk to doc.
   * @param i position
   * @param chunkContent content
   */
  add(i?: number, chunkContent?: ChunkContent): void;
  create(i?: number): void;
  addFromText(i: number, text: string): void;
  del(id: string): void;
  move(id: string, pos: number): void;
}

class ChunkListState {
  constructor(public chunks: Chunk[]) {}
  cloen(): ChunkListState {
    return new ChunkListState([...this.chunks]);
  }
}
interface ChunkListStateMutator {
  (state: ChunkListState): ChunkListState;
}

// TODO(vi117): make class rather than function.
function makeCreateMutator(chunkId: string, i?: number, chunkContent?: ChunkContent): ChunkListStateMutator {
  return (state: ChunkListState) => {
    chunkContent = chunkContent ?? { type: "text", content: "" };
    const chunks = [...state.chunks];
    if (i === undefined) {
      chunks.push({
        id: chunkId,
        ...chunkContent,
      });
    } else {
      chunks.splice(i, 0, { id: chunkId, ...chunkContent });
    }
    return new ChunkListState(chunks);
  };
}

function makeDeleteMutator(id: string): ChunkListStateMutator {
  return (state: ChunkListState) => {
    const chunks = [...state.chunks];
    const i = chunks.findIndex(c => c.id === id);
    if (i < 0) {
      return state;
    }
    chunks.splice(i, 1);
    return new ChunkListState(chunks);
  };
}

function makeMoveMutator(id: string, pos: number): ChunkListStateMutator {
  return (state: ChunkListState) => {
    const chunks = [...state.chunks];
    const i = chunks.findIndex(c => c.id === id);
    if (i < 0) {
      return state;
    }
    const chunk = chunks[i];
    chunks.splice(i, 1);
    chunks.splice(pos, 0, chunk);
    return new ChunkListState(chunks);
  };
}

function makeModifyMutator(id: string, chunkContent: ChunkContent): ChunkListStateMutator {
  return (state: ChunkListState) => {
    const chunks = [...state.chunks];
    const i = chunks.findIndex(c => c.id === id);
    if (i < 0) {
      console.log("chunk not found");
      return state;
    }
    chunks[i] = { ...chunks[i], ...chunkContent };
    return new ChunkListState(chunks);
  };
}

type ChunkListHistoryElem = {
  state: ChunkListState;
  mutator: ChunkListStateMutator;
  updatedAt: number;
};

class ChunkListHistory {
  constructor(public history: ChunkListHistoryElem[] = [], public limit: number = 20) {}
  private applyLast(mutator: ChunkListStateMutator, updatedAt: number): void {
    const state = this.current.cloen();
    const newState = mutator(state);
    this.history.push({ state: newState, mutator, updatedAt });
    if (this.history.length > this.limit) {
      this.history.shift();
    }
  }
  get current(): ChunkListState {
    return this.history[this.history.length - 1].state;
  }
  get currentUpdatedAt(): number {
    return this.history[this.history.length - 1].updatedAt;
  }
  revoke(): void {
    this.history.pop();
  }
  /**
   * apply the mutator
   * @param mutator mutator to apply
   * @param updatedAt method time to be applied
   * @returns if suuccessfully applied. if not, it means the mutator is too old.
   */
  apply(mutator: ChunkListStateMutator, updatedAt: number): boolean {
    // TODO(vi117): if updatedAt is equal to currentUpdatedAt, order is not guaranteed.
    // so change `model` to give order.
    const pos = this.history.findIndex(h => h.updatedAt > updatedAt);
    if (pos < 0) {
      this.applyLast(mutator, updatedAt);
      return true;
    } // if too old, do not apply
    else if (pos === 0) {
      return false;
      // TODO(vi117): we can't use applyLast because it is too old.
      // implement refreshing document.
    } else {
      const reapplied = this.history.splice(pos, this.history.length - pos);
      this.apply(mutator, updatedAt);
      reapplied.forEach(h => this.applyLast(h.mutator, h.updatedAt));
      return true;
    }
  }
}

interface ChunkMutator {
  setType(t: ChunkContentKind): void;
  setContent(s: string): void;
}

export class DocumentViewModel extends EventTarget implements IDocumentViewModel {
  readonly type = "document";
  readonly docPath: string;
  chunks: Chunk[];
  history: ChunkListHistory;
  buffer: stl.PriorityQueue<{ seq: number; mutate: ChunkListStateMutator; updatedAt: number }>;
  seq: number;
  tags: string[];
  updatedAt: number;
  tagsUpdatedAt: number;

  constructor(doc: DocumentObject) {
    super();
    this.chunks = doc.chunks;
    this.docPath = doc.docPath;
    this.tags = doc.tags;
    this.updatedAt = doc.updatedAt;
    this.tagsUpdatedAt = doc.tagsUpdatedAt;
    this.seq = doc.seq;
    this.history = new ChunkListHistory([{
      state: new ChunkListState(this.chunks),
      mutator: () => new ChunkListState(this.chunks),
      updatedAt: this.updatedAt,
    }]);
    this.buffer = new stl.PriorityQueue((a, b) => a.seq < b.seq);
    manager.addEventListener("notification", (e: RPCNotificationEvent) => {
      console.log("notification", e.notification);
      this.updateOnNotification(e.notification);
    });
  }

  get nextSeq(): number {
    return this.seq + 1;
  }

  updateOnNotification(notification: ChunkNotification): void {
    if (notification.method === "chunk.refresh") {
      // TODO(vi117): implement refreshing document.
    } else if (notification.method === "chunk.update") {
      const { docPath, method, seq, updatedAt } = notification.params;
      if (docPath !== this.docPath) {
        return;
      }
      let mutator: ChunkListStateMutator;
      const kind = method.method;
      switch (kind) {
        case "chunk.create":
          // TODO(vi117): I assume that chunkId is not undefined.
          // make notification class that have chunkId.
          mutator = makeCreateMutator(method.chunkId, method.position, method.chunkContent);
          break;
        case "chunk.delete":
          mutator = makeDeleteMutator(method.chunkId);
          break;
        case "chunk.move":
          mutator = makeMoveMutator(method.chunkId, method.position);
          break;
        case "chunk.modify":
          mutator = makeModifyMutator(method.chunkId, method.chunkContent);
          break;
        default:
          const _: never = kind; // exhaustiveCheck
          throw new Error(`unknown method: ${method}`);
      }
      this.apply(mutator, updatedAt, seq);
    }
  }

  private updateMark(updatedAt: number) {
    if (this.updatedAt < updatedAt) {
      this.updatedAt = updatedAt;
    }
  }

  apply(mutator: ChunkListStateMutator, updatedAt: number, seq: number, refresh: boolean = true): void {
    if (this.nextSeq !== seq) {
      this.buffer.push({ seq, mutate: mutator, updatedAt });
      return;
    }
    let currentUpdatedAt = updatedAt;
    this.history.apply(mutator, currentUpdatedAt);
    this.seq = seq;
    while (
      (!this.buffer.empty())
      && this.buffer.top().seq === this.nextSeq
    ) {
      const { mutate, updatedAt, seq } = this.buffer.top();
      this.buffer.pop();
      this.history.apply(mutate, updatedAt);
      this.seq = seq;
      currentUpdatedAt = updatedAt;
    }
    this.updateMark(currentUpdatedAt);
    this.chunks = this.history.current.chunks;
    if (refresh) {
      console.log("apply", this.chunks);
      this.dispatchEvent(new Event("chunksChange"));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateAsSource(_path: string, _updatedAt: number): void {
    throw new Error("Method not implemented.");
  }

  // TODO(vi117): extract method
  useChunks(): [Chunk[], ChunkListMutator] {
    const [chunks, setChunks] = useState(this.chunks);

    useEffect(() => {
      const onChange = () => {
        setChunks([...this.chunks]);
      };
      this.addEventListener("chunksChange", onChange);
      return () => {
        this.removeEventListener("chunksChange", onChange);
      };
    }, [chunks]);

    const add = async (i?: number, chunkContent?: ChunkContent) => {
      i = i ?? chunks.length;

      chunkContent = chunkContent ?? {
        type: "text",
        content: "",
      };

      const ps = {
        docPath: this.docPath,
        position: i,
        chunkId: uuidv4(),
        chunkContent: chunkContent,
        docUpdatedAt: this.updatedAt,
      };

      // FIXME: this sends requests, but reutrns error.
      const { updatedAt, chunkId, seq } = await chunkCreate(manager, ps);
      const mutator = makeCreateMutator(chunkId, i, chunkContent);
      this.apply(mutator, updatedAt, seq);
    };

    const create = async (i?: number) => {
      await add(i);
    };

    const addFromText = async (i: number | undefined, text: string) => {
      await add(i, { type: "text", content: text });
    };

    const del = async (id: string) => {
      const ps = {
        docPath: this.docPath,
        chunkId: id,
        docUpdatedAt: this.updatedAt,
      };

      const { updatedAt, seq } = await chunkDelete(manager, ps);
      const mutator = makeDeleteMutator(id);
      this.apply(mutator, updatedAt, seq);
    };

    const move = async (id: string, pos: number) => {
      const ps = {
        docPath: this.docPath,
        chunkId: id,
        position: pos,
        docUpdatedAt: this.updatedAt,
      };

      const { updatedAt, seq } = await chunkMove(manager, ps);
      const mutator = makeMoveMutator(id, pos);
      this.apply(mutator, updatedAt, seq);
    };

    return [chunks, {
      add,
      create,
      addFromText,
      del,
      move,
    }];
  }

  useTags(): [string[], (tags: string[]) => Promise<void>] {
    const [tags, set] = useState(this.tags);

    useEffect(() => {
      const onChange = () => {
        set([...this.tags]);
      };
      this.addEventListener("tagsChange", onChange);
      return () => {
        this.removeEventListener("tagsChange", onChange);
      };
    }, [tags]);

    const setTags = async (tags: string[]) => {
      this.tags = tags;
      this.dispatchEvent(new Event("tagsChange"));
      // TODO: update tags to server
    };

    return [tags, setTags];
  }

  // TODO(vi117): extract and make chunk view model.
  useChunk(chunk_arg: Chunk): [Chunk, ChunkMutator] {
    const [chunk, setChunk] = useState(chunk_arg);

    useEffect(() => {
      const onChange = () => {
        // TODO: update chunk efficiently. this is O(n^2)
        setChunk(this.chunks.find(chunk => chunk.id === chunk_arg.id) ?? chunk_arg);
      };
      this.addEventListener("chunksChange", onChange);
      return () => {
        this.removeEventListener("chunksChange", onChange);
      };
    }, [chunk]);

    const updateChunk = async (nchunk: Chunk) => {
      if (nchunk.type === chunk.type && nchunk.content === chunk.content) return;
      const ps = {
        docPath: this.docPath,
        chunkId: chunk.id,
        chunkContent: {
          type: nchunk.type,
          content: nchunk.content,
        },
        docUpdatedAt: this.updatedAt,
      };

      const { updatedAt, seq } = await chunkModify(manager, ps);
      const mutator = makeModifyMutator(chunk.id, nchunk);
      this.apply(mutator, updatedAt, seq, false);
      setChunk(nchunk);
    };

    const setType = async (t: ChunkContentKind) => {
      const nchunk = { ...chunk, type: t };
      await updateChunk(nchunk);
    };

    const setContent = async (c: string) => {
      const nchunk = { ...chunk, content: c };
      await updateChunk(nchunk);
    };

    return [chunk, { setType, setContent }];
  }
}

export function createTestDocViewModel(url: string, path: string) {
  const [doc, setDoc] = useState<DocumentViewModel | null>(null);

  useEffect(() => {
    if (!doc) getDoc();
  });

  const getDoc = async () => {
    console.log("connect to ", url);
    await manager.open(url);
    const d = await openDocument(manager, path);
    const viewModel = new DocumentViewModel(d);
    // for debbuging
    (self as any).docViewModel = viewModel;
    setDoc(viewModel);
  };

  return doc;
}

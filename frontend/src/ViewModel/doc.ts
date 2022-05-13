import { Chunk, ChunkContent, ChunkContentKind, DocumentObject } from "model";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { chunkCreate, chunkDelete, chunkModify, chunkMove } from "../Model/chunk";
import { openDocument } from "../Model/Document";
import { RPCManager as manager } from "../Model/RPCManager";

interface ViewModelBase {
  updateAsSource(path: string, updatedAt: number): void;
}

export interface IViewModel extends ViewModelBase {
  pageView: IPageViewModel;
}

export class BlankPage implements IPageViewModel {
  type = "blank";
  constructor() {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateAsSource(_path: string, _updatedAt: number): void {
    // do nothing
  }
}

class ViewModel implements IViewModel {
  pageView: IPageViewModel;
  constructor() {
    this.pageView = new BlankPage();
  }
  updateAsSource(path: string, updatedAt: number): void {
    this.pageView.updateAsSource(path, updatedAt);
  }
}

// export const store = new ViewModel();

interface IPageViewModel extends ViewModelBase {
  readonly type: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IDocumentViewModel extends IPageViewModel {
}

interface ChunkListMutator {
  add(i?: number, chunkContent?: ChunkContent): void;
  create(i?: number): void;
  addFromText(i: number, text: string): void;
  del(id: string): void;
  move(id: string, pos: number): void;
}

interface ChunkMutator {
  setType(t: ChunkContentKind): void;
  setContent(s: string): void;
}

export class DocumentViewModel extends EventTarget implements IDocumentViewModel {
  type = "document";
  docPath: string;
  chunks: Chunk[];
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
  }

  updateMark(updatedAt: number) {
    if (this.updatedAt < updatedAt) {
      this.updatedAt = updatedAt;
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

    /**
     * add chunk to doc.
     * @param i position
     * @param chunkContent content
     */
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
      const { updatedAt } = await chunkCreate(manager, ps);

      chunks.splice(i, 0, { ...chunkContent, id: ps.chunkId });
      this.updateMark(updatedAt);
      this.dispatchEvent(new Event("chunksChange"));
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

      const { updatedAt } = await chunkDelete(manager, ps);
      const i = chunks.findIndex((c) => c.id === id);
      this.chunks.splice(i, 1);
      this.updateMark(updatedAt);
      this.dispatchEvent(new Event("chunksChange"));
    };

    const move = async (id: string, pos: number) => {
      const ps = {
        docPath: this.docPath,
        chunkId: id,
        position: pos,
        docUpdatedAt: this.updatedAt,
      };

      const { updatedAt } = await chunkMove(manager, ps);
      const i = chunks.findIndex((c) => c.id === id);
      const chunk = chunks[i];
      this.chunks.splice(i, 1);
      this.chunks.splice((pos <= i) ? pos : pos - 1, 0, chunk);
      this.updateMark(updatedAt);
      this.dispatchEvent(new Event("chunksChange"));
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

    // useEffect(() => {
    //    const onChange = () => {
    //        setChunk(chunk);
    //    };
    //    this.addEventListener("chunkChange"+chunk.id, onChange);
    //    return () => {
    //        this.removeEventListener("chunkChange"+chunk.id, onChange);
    //    }
    // }, [chunk]);

    const updateChunk = async (nchunk: Chunk) => {
      const ps = {
        docPath: this.docPath,
        chunkId: chunk.id,
        chunkContent: {
          type: nchunk.type,
          content: nchunk.content,
        },
        docUpdatedAt: this.updatedAt,
      };

      const { updatedAt } = await chunkModify(manager, ps);
      this.updateMark(updatedAt);
      const index = this.chunks.findIndex((c) => c.id === chunk.id);
      this.chunks[index] = nchunk;
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

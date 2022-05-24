import { ChunkNotification, DocumentObject, RPCNotification } from "model";
import { useEffect, useState } from "react";
import { openDocument } from "../Model/Document";
import { getOpenedManagerInstance, IRPCMessageManager, RPCNotificationEvent } from "../Model/mod";
import { ChunkListMutator, ChunkListViewModel, ChunkViewModel } from "./chunklist";
import { IPageViewModel } from "./page";

export interface IDocumentViewModel extends IPageViewModel {
  docPath: string;

  updateOnNotification(notification: ChunkNotification): void;
  useChunks(): [ChunkViewModel[], ChunkListMutator];
  useTags(): [string[], (tags: string[]) => Promise<void>];
}

export class DocumentViewModel extends EventTarget implements IDocumentViewModel {
  readonly type = "document";
  readonly docPath: string;
  chunks: ChunkListViewModel;
  tags: string[];
  tagsUpdatedAt: number;
  manager: IRPCMessageManager;

  constructor(doc: DocumentObject, rpcManager: IRPCMessageManager) {
    super();

    this.manager = rpcManager;
    this.docPath = doc.docPath;
    this.tags = doc.tags;
    this.tagsUpdatedAt = doc.tagsUpdatedAt;

    this.chunks = new ChunkListViewModel(this.docPath, doc.chunks, doc.updatedAt, doc.seq, rpcManager);

    this.manager.addEventListener("notification", (e: RPCNotificationEvent) => {
      console.log("notification", e.notification);
      this.updateOnNotification(e.notification);
    });
  }

  updateOnNotification(notification: RPCNotification): void {
    if (notification.method === "chunk.refresh") {
      // TODO(vi117): implement refreshing document.
    } else if (notification.method === "chunk.update") {
      if (notification.params.docPath === this.docPath) {
        this.chunks.updateOnNotification(notification);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateAsSource(_path: string, _updatedAt: number): void {
    throw new Error("Method not implemented.");
  }

  // TODO(vi117): extract method
  useChunks(): [ChunkViewModel[], ChunkListMutator] {
    return this.chunks.useChunks();
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
}

export function useDocViewModel(path: string) {
  const [doc, setDoc] = useState<DocumentViewModel | null>(null);

  useEffect(() => {
    if (!doc) getDoc();
  });

  const getDoc = async () => {
    const manager = await getOpenedManagerInstance();
    const d = await openDocument(manager, path);
    const viewModel = new DocumentViewModel(d, manager);
    // for debbuging
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).docViewModel = viewModel;
    setDoc(viewModel);
  };

  return doc;
}

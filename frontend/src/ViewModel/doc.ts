import { ChunkNotification, DocumentObject, RPCNotification } from "model";
import { useEffect, useState } from "react";
import { openDocument } from "../Model/Document";
import {
    getOpenedManagerInstance,
    IRPCMessageManager,
    RPCNotificationEvent,
} from "../Model/mod";
import {
    ChunkListMutator,
    ChunkListViewModel,
    IChunkViewModel,
} from "./chunklist";
import { IPageViewModel } from "./page";

import { IDisposable, makeDisposable } from "./IDisposable";

export interface IDocumentViewModel extends IPageViewModel {
    docPath: string;
    readonly writable: boolean;

    updateOnNotification(notification: ChunkNotification): void;
    useChunks(): [IChunkViewModel[], ChunkListMutator];
    useTags(): [string[], (tags: string[]) => Promise<void>];

    /**
     * hook of writable
     * @returns writable, setWritable
     */
    useWritable(): [boolean, (writable: boolean) => Promise<void>];
}

export type DocumentViewModelOptions = {
    wriatble?: boolean;
};

export class DocumentViewModel extends makeDisposable(EventTarget)
    implements IDocumentViewModel, IDisposable
{
    readonly type = "document";
    readonly docPath: string;
    chunks: ChunkListViewModel;
    tags: string[];
    tagsUpdatedAt: number;
    manager: IRPCMessageManager;
    writable: boolean;

    constructor(
        doc: DocumentObject,
        rpcManager: IRPCMessageManager,
        options: DocumentViewModelOptions = {},
    ) {
        super();
        this.writable = options.wriatble ?? false;
        this.manager = rpcManager;
        this.docPath = doc.docPath;
        this.tags = doc.tags;
        this.tagsUpdatedAt = doc.tagsUpdatedAt;

        this.chunks = new ChunkListViewModel(
            this.docPath,
            doc.chunks,
            doc.updatedAt,
            doc.seq,
            rpcManager,
        );

        const onChunkNotification = (notification: RPCNotificationEvent) => {
            console.log("notification", notification.notification);
            this.updateOnNotification(notification.notification);
        };
        this.manager.addEventListener("notification", onChunkNotification);
        this.addDisposable({
            dispose: () => {
                this.manager.removeEventListener(
                    "notification",
                    onChunkNotification,
                );
            },
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
    useChunks(): [IChunkViewModel[], ChunkListMutator] {
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

    /**
     * hook of writable
     * @returns writable, setWritable
     */
    useWritable(): [boolean, (writable: boolean) => Promise<void>] {
        const [writable, set] = useState(this.writable);

        useEffect(() => {
            const onChange = () => {
                set(this.writable);
            };
            this.addEventListener("writableChange", onChange);
            return () => {
                this.removeEventListener("writableChange", onChange);
            };
        }, [writable]);

        const setWritable = async (writable: boolean) => {
            this.writable = writable;
            this.dispatchEvent(new Event("writableChange"));
        };

        return [writable, setWritable];
    }
}

export function useDocViewModel(path: string) {
    const [doc, setDoc] = useState<DocumentViewModel | null>(null);

    useEffect(() => {
        console.log("useDocViewModel: ", path);
        if (doc != null) {
            console.log("dispose");
            doc.dispose();
        }
        setDoc(null);
        getDoc();
    }, [path]);

    const getDoc = async () => {
        const manager = await getOpenedManagerInstance();
        const d = await openDocument(manager, path);
        const viewModel = new DocumentViewModel(d.doc, manager, {
            wriatble: d.writable,
        });
        // for debbuging
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (self as any).docViewModel = viewModel;
        setDoc(viewModel);
    };

    return doc;
}

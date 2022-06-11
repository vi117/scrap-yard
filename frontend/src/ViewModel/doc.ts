import {
    ChunkNotification,
    DocumentObject,
    RPCErrorCode,
    RPCNotification,
} from "model";
import { useEffect, useState } from "react";
import { openDocument, setDocumentTags } from "../Model/Document";
import {
    getOpenedManagerInstance,
    IRPCMessageManager,
    RPCErrorWrapper,
    RPCNotificationEvent,
} from "../Model/mod";
import {
    ChunkListMutator,
    ChunkListViewModel,
    IChunkViewModel,
} from "./chunklist";

import { IDisposable, makeDisposable } from "./IDisposable";

export interface IDocumentViewModel {
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
    implements IDocumentViewModel, IDisposable {
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
        const method = notification.method;
        switch (method) {
            case "chunk.update":
                if (notification.params.docPath === this.docPath) {
                    this.chunks.updateOnNotification(notification);
                }
                break;
            case "chunk.refresh":
                // TODO(vi117): implement refreshing document.
                break;
            case "document.tags":
                if (notification.params.docPath === this.docPath) {
                    const { tags, updatedAt } = notification.params;
                    this.updateTags(tags, updatedAt);
                }
                break;
        }
    }

    // TODO(vi117): extract method
    useChunks(): [IChunkViewModel[], ChunkListMutator] {
        return this.chunks.useChunks();
    }

    updateTags(tags: string[], updatedAt: number): void {
        this.tags = tags;
        this.tagsUpdatedAt = updatedAt;
        this.dispatchEvent(new Event("tagsChange"));
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
            const manager = this.manager;
            try {
                const res = await setDocumentTags(
                    manager,
                    this.docPath,
                    tags,
                    this.tagsUpdatedAt,
                );
                this.updateTags(tags, res.updatedAt);
            } catch (e) {
                if (e instanceof RPCErrorWrapper) {
                    if (e.code === RPCErrorCode.TagsConflict) {
                        // TODO(vi117): Replace data type of TagsConflictError
                        const data = e.data as {
                            tags: string[];
                            updatedAt: number;
                        };
                        this.updateTags(data.tags, data.updatedAt);
                    } else {
                        throw e;
                    }
                } else {
                    throw e;
                }
            }
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

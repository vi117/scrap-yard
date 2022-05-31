import {
    Chunk,
    ChunkContent,
    ChunkContentKind,
    compareChunkContent,
    RPCNotification,
} from "model";
import { useEffect, useState } from "react";
import * as stl from "tstl";
import { v4 as uuidv4 } from "uuid";
import {
    chunkCreate,
    chunkDelete,
    chunkModify,
    chunkMove,
    IRPCMessageManager,
} from "../Model/mod";

export interface ChunkListMutator {
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

export interface ChunkMutator {
    setType(t: ChunkContentKind): void;
    setContent(s: string): void;
}

type ChunkState = Chunk & {
    updatedAt: number;
};

type ChunkListState = ChunkState[];

interface ChunkListStateMutator {
    (state: ChunkListState): ChunkListState;
}

// TODO(vi117): make class rather than function.
function makeCreateMutator(
    chunkId: string,
    updatedAt: number,
    i?: number,
    chunkContent?: ChunkContent,
): ChunkListStateMutator {
    return (state: ChunkListState) => {
        chunkContent = chunkContent ?? { type: "text", content: "" };
        const chunks = [...state];
        if (i === undefined) {
            chunks.push({
                id: chunkId,
                ...chunkContent,
                updatedAt,
            });
        } else {
            chunks.splice(i, 0, { id: chunkId, ...chunkContent, updatedAt });
        }
        return (chunks);
    };
}

function makeDeleteMutator(id: string): ChunkListStateMutator {
    return (state: ChunkListState) => {
        const chunks = [...state];
        const i = chunks.findIndex(c => c.id === id);
        if (i < 0) {
            return state;
        }
        chunks.splice(i, 1);
        return chunks;
    };
}

function makeMoveMutator(id: string, pos: number): ChunkListStateMutator {
    return (state: ChunkListState) => {
        const chunks = [...state];
        const i = chunks.findIndex(c => c.id === id);
        if (i < 0) {
            return state;
        }
        const chunk = chunks[i];
        chunks.splice(i, 1);
        chunks.splice(pos < i ? pos : pos - 1, 0, chunk);
        return chunks;
    };
}

function makeModifyMutator(
    id: string,
    chunkContent: ChunkContent,
    updatedAt: number,
): ChunkListStateMutator {
    return (state: ChunkListState) => {
        const chunks = [...state];
        const i = chunks.findIndex(c => c.id === id);
        if (i < 0) {
            console.log("chunk not found");
            return state;
        }
        chunks[i] = { ...chunks[i], ...chunkContent, updatedAt };
        return (chunks);
    };
}

type ChunkListHistoryElem = {
    state: ChunkListState;
    mutator: ChunkListStateMutator;
    updatedAt: number;
};

class ChunkListHistory {
    constructor(
        public history: ChunkListHistoryElem[] = [],
        public limit: number = 20,
    ) {}
    private applyLast(mutator: ChunkListStateMutator, updatedAt: number): void {
        const newState = mutator(this.current);
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
            const reapplied = this.history.splice(
                pos,
                this.history.length - pos,
            );
            this.apply(mutator, updatedAt);
            reapplied.forEach(h => this.applyLast(h.mutator, h.updatedAt));
            return true;
        }
    }
}

export interface IChunkListViewModel {
    docPath: string;

    updateOnNotification(notification: RPCNotification): void;
    useChunks(): [IChunkViewModel[], ChunkListMutator];
}

export interface IChunkViewModel {
    parent: IChunkListViewModel;
    id: string;
    focus(): void;
    unfocus(): void;

    useFocus(): boolean;

    useChunk(): [Chunk, ChunkMutator];

    setState(state: ChunkState): void;
}

export class ChunkViewModel extends EventTarget implements IChunkViewModel {
    chunk: Chunk;
    updatedAt: number;
    focused: boolean;
    overwrite?: Chunk;
    parent: ChunkListViewModel;
    manager: IRPCMessageManager;

    constructor(parent: ChunkListViewModel, chunk: Chunk, updatedAt: number) {
        super();
        this.manager = parent.manager;
        this.focused = false;
        this.parent = parent;
        this.chunk = chunk;
        this.updatedAt = updatedAt;
    }

    get id(): string {
        return this.chunk.id;
    }

    focus() {
        if (this.focused) return;
        this.parent.chunks.forEach(c => {
            if (c !== this) {
                c.unfocus();
            }
        });
        this.focused = true;
        this.dispatchEvent(new Event("focus"));
    }

    unfocus() {
        if (!this.focused) return;
        this.focused = false;
        this.dispatchEvent(new Event("unfocus"));
    }

    useFocus() {
        const [focus, setFocus] = useState(this.focused);
        useEffect(() => {
            const onFocus = () => setFocus(true);
            const onUnfocus = () => setFocus(false);
            this.addEventListener("focus", onFocus);
            this.addEventListener("unfocus", onUnfocus);
            return () => {
                this.removeEventListener("focus", onFocus);
                this.removeEventListener("unfocus", onUnfocus);
            };
        }, [this]);
        return focus;
    }

    get content(): ChunkContent {
        return this.chunk;
    }

    /**
     * chunklist inner use only.
     * @param content new content
     */
    setState(state: ChunkState) {
        const { updatedAt, ...content } = state;
        if (updatedAt !== this.updatedAt) {
            if (this.focused) {
                this.overwrite = this.chunk;
            }
            this.chunk = { ...this.chunk, ...content };
            this.dispatchEvent(new Event("chunkChange"));
        }
    }

    useChunk(): [Chunk, ChunkMutator] {
        const [chunk, setChunk] = useState<Chunk>(this.chunk);
        useEffect(() => {
            const onChange = () => {
                setChunk(this.chunk);
            };
            this.addEventListener("chunkChange", onChange);
            return () => {
                this.removeEventListener("chunkChange", onChange);
            };
        }, [chunk]);

        const updateChunk = async (nchunk: Chunk) => {
            if (
                compareChunkContent(nchunk, this.chunk)
            ) {
                return;
            }
            const { id, ...content } = nchunk;
            const ps = {
                docPath: this.parent.docPath,
                chunkId: id,
                chunkContent: {
                    ...content,
                },
                docUpdatedAt: this.parent.updatedAt,
            };

            const { updatedAt, seq } = await chunkModify(this.manager, ps);
            const mutator = makeModifyMutator(chunk.id, nchunk, updatedAt);
            this.parent.apply(mutator, updatedAt, seq);
            setChunk(nchunk);
        };

        const setType = async (t: ChunkContentKind) => {
            // TODO(vi117): translate chunk to chunk.
            // If you change the type from csv to markdown, you need to convert the contents of the csv to a table in markdown.
            const nchunk: Chunk = { ...chunk, type: t } as Chunk;
            await updateChunk(nchunk);
        };

        const setContent = async (c: string) => {
            const nchunk = { ...chunk, content: c };
            await updateChunk(nchunk);
        };

        return [chunk, { setType, setContent }];
    }
}

export class ChunkListViewModel extends EventTarget
    implements IChunkListViewModel
{
    chunks: ChunkViewModel[];
    history: ChunkListHistory;
    buffer: stl.PriorityQueue<
        { seq: number; mutate: ChunkListStateMutator; updatedAt: number }
    >;
    seq: number;
    updatedAt: number;
    docPath: string;
    manager: IRPCMessageManager;

    // TODO(vi117): parameter options
    constructor(
        docPath: string,
        chunks: Chunk[],
        updatedAt: number,
        seq: number,
        manager: IRPCMessageManager,
    ) {
        super();
        this.manager = manager;
        this.docPath = docPath;
        this.chunks = chunks.map(c => new ChunkViewModel(this, c, updatedAt));
        this.updatedAt = updatedAt;
        this.seq = seq;
        this.history = new ChunkListHistory([{
            state: (chunks.map(c => ({ ...c, updatedAt: updatedAt }))),
            mutator: () => (chunks.map(c => ({ ...c, updatedAt: updatedAt }))),
            updatedAt: this.updatedAt,
        }]);
        this.buffer = new stl.PriorityQueue((a, b) => a.seq < b.seq);
    }

    get nextSeq(): number {
        return this.seq + 1;
    }

    updateOnNotification(notification: RPCNotification): void {
        if (notification.method === "chunk.refresh") {
            // TODO(vi117): implement refreshing document.
        } else if (notification.method === "chunk.update") {
            const { method, seq, updatedAt } = notification.params;
            // TODO(vi117): extract as factory.
            let mutator: ChunkListStateMutator;
            const kind = method.method;
            switch (kind) {
                case "chunk.create":
                    mutator = makeCreateMutator(
                        method.chunkId,
                        updatedAt,
                        method.position,
                        method.chunkContent,
                    );
                    break;
                case "chunk.delete":
                    mutator = makeDeleteMutator(method.chunkId);
                    break;
                case "chunk.move":
                    mutator = makeMoveMutator(method.chunkId, method.position);
                    break;
                case "chunk.modify":
                    mutator = makeModifyMutator(
                        method.chunkId,
                        method.chunkContent,
                        updatedAt,
                    );
                    break;
                default: {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const _: never = kind; // exhaustiveCheck
                    throw new Error(`unknown method: ${method}`);
                }
            }
            this.apply(mutator, updatedAt, seq);
        }
    }

    private updateMark(updatedAt: number) {
        if (this.updatedAt < updatedAt) {
            this.updatedAt = updatedAt;
        }
    }

    apply(
        mutator: ChunkListStateMutator,
        updatedAt: number,
        seq: number,
        refresh = true,
    ): void {
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

        // get chunk view model from history.
        const appiledChunks: ChunkViewModel[] = [];
        // TODO(vi117): it is not efficient. O(n^2). use id map.
        for (const chunk of this.history.current) {
            const ch = this.chunks.find(c => c.id === chunk.id);
            // if new chunk, create new chunk view model.
            if (ch === undefined) {
                appiledChunks.push(
                    new ChunkViewModel(this, chunk, currentUpdatedAt),
                );
            } else {
                // if chunk exists, update chunk view model.
                ch.setState(chunk);
                appiledChunks.push(ch);
            }
        }
        this.chunks = appiledChunks;

        if (refresh) {
            this.dispatchEvent(new Event("chunksChange"));
        }
    }

    useChunks(): [ChunkViewModel[], ChunkListMutator] {
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
            i = i ?? this.chunks.length;

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
            const { updatedAt, chunkId, seq } = await chunkCreate(
                this.manager,
                ps,
            );
            const mutator = makeCreateMutator(
                chunkId,
                updatedAt,
                i,
                chunkContent,
            );
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

            const { updatedAt, seq } = await chunkDelete(this.manager, ps);
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

            const { updatedAt, seq } = await chunkMove(this.manager, ps);
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
}

import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import { ClickAwayListener, Fab, Paper, Popper, Zoom } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import {
    ChunkListMutator,
    ChunkMutator,
    IChunkListViewModel,
    IChunkViewModel,
} from "../ViewModel/chunklist";
import { IDocumentViewModel } from "../ViewModel/doc";

import { Chunk, ChunkContent, ChunkContentKind } from "model";
import { atom, useRecoilValue, useSetRecoilState } from "recoil";
import { ChunkList } from "./Document";

const stash = "stash";

function save(doc: Chunk[]) {
    window.localStorage.setItem(stash, JSON.stringify(doc));
}

function load(): Chunk[] {
    const items = window.localStorage.getItem(stash);
    if (items == null) {
        return [];
    } else {
        return JSON.parse(items);
    }
}

class LocalChunk extends EventTarget implements IChunkViewModel {
    focusState = false;
    constructor(public parent: LocalDocument, public ch: Chunk) {
        super();
    }

    get id(): string {
        return this.ch.id;
    }
    focus(): void {
        if (this.focusState) return;
        this.focusState = true;
        this.parent.chunks.forEach((c) => c.unfocus());

        this.dispatchEvent(new Event("focus"));
    }
    unfocus(): void {
        if (!this.focusState) return;
        this.focusState = false;
        this.dispatchEvent(new Event("unfocus"));
    }
    useFocus(): boolean {
        const ch = useMemo(() => this.focusState, [this.focusState]);
        return ch;
    }
    useChunk(): [Chunk, ChunkMutator] {
        const [updateAt, setUpdateAt] = useState(0);
        const chunk = useMemo(() => this.ch, [updateAt]);

        const updateChunk = () => {
            setUpdateAt(updateAt + 1);
            save(this.parent.chunks.map(x => x.ch));
        };

        const setType = (t: ChunkContentKind) => {
            this.ch.type = t;
            updateChunk();
        };

        const setContent = (content: string) => {
            this.ch.content = content;
            updateChunk();
        };

        return [chunk, { setType, setContent }];
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setState(_state: Chunk & { updatedAt: number }): void {
        throw new Error("unreachable");
    }
}

class LocalDocument implements IDocumentViewModel, IChunkListViewModel {
    docPath = stash;
    chunks: LocalChunk[];
    type = "local";
    writable = true;

    constructor() {
        this.chunks = load().map((x: Chunk) => new LocalChunk(this, x));
    }
    useWritable(): [boolean, (writable: boolean) => Promise<void>] {
        throw new Error("Unreachable");
    }
    updateAsSource(_path: string, _updatedAt: number): void {
        // nop
        throw new Error("unreachable");
    }

    updateOnNotification() {
        // nop
        throw new Error("unreachable");
    }
    applyChunkList(chunkList: Chunk[]) {
        this.chunks = chunkList.map(x => new LocalChunk(this, x));
        save(this.chunks.map(x => x.ch));
    }

    useChunks(): [IChunkViewModel[], ChunkListMutator] {
        const [updateAt, setUpdateAt] = useState(0);
        const chunks = useMemo(() => this.chunks.map(x => x.ch), [updateAt]);

        const add = (i?: number, chunkContent?: Chunk) => {
            i = i ?? chunks.length;

            const id = uuidv4();
            const chunk: Chunk = chunkContent ?? {
                id: id,
                type: "text",
                content: "",
            };

            const nc = chunks.slice();
            nc.splice(i, 0, chunk);
            this.applyChunkList(nc);
            setUpdateAt(updateAt + 1);
        };

        const create = (i?: number) => {
            add(i);
        };

        const addFromText = (i: number, text: string) => {
            add(i, { type: "text", content: text, id: uuidv4() });
        };

        const del = (id: string) => {
            const i = chunks.findIndex((c) => c.id === id);
            if (i < 0) return "";

            const nc = chunks.slice();
            nc.splice(i, 1);
            this.applyChunkList(nc);
            setUpdateAt(updateAt + 1);
        };

        const move = (id: string, pos: number) => {
            const i = chunks.findIndex((c) => c.id === id);

            const nc = chunks.slice();
            const chunk = nc[i];
            nc.splice(i, 1);
            nc.splice((pos >= i) ? pos - 1 : pos, 0, chunk);
            this.applyChunkList(nc);
            setUpdateAt(updateAt + 1);
        };

        return [this.chunks, { add, create, addFromText, del, move }];
    }

    useTags(): [string[], (tag: string[]) => Promise<void>] {
        return [[], () => Promise.resolve()];
    }
}

export function Stash() {
    const doc = new LocalDocument();

    const [open, setOpen] = useState(false);
    const anchorRef = useRef(null);

    return (
        <>
            <Fab
                onClick={() => setOpen(!open)}
                ref={anchorRef}
                sx={{
                    position: "fixed",
                    right: "1em",
                    bottom: "1em",
                }}
            >
                <ContentPasteIcon />
            </Fab>
            <Popper
                open={open}
                anchorEl={anchorRef.current}
                placement="top"
            >
                <ClickAwayListener
                    onClickAway={() => setOpen(false)}
                >
                    <Zoom in={open}>
                        <Paper
                            sx={{
                                width: 600,
                                maxHeight: "80vh",
                                overflow: "scroll",
                            }}
                        >
                            <ChunkList doc={doc} readonly={false} />
                        </Paper>
                    </Zoom>
                </ClickAwayListener>
            </Popper>
        </>
    );
}

export default Stash;

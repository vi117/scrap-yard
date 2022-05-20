import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import { ClickAwayListener, Fab, Paper, Popper, Zoom } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { IDocumentViewModel } from "../ViewModel/doc";
import { ChunkList } from "./Document";

const stash = "stash";

function save(doc) {
  window.localStorage.setItem(stash, JSON.stringify(doc));
}

function load() {
  return JSON.parse(window.localStorage.getItem(stash));
}

class LocalDocument implements IDocumentViewModel {
  docPath = stash;
  chunks = [];

  constructor() {
    this.chunks = this.loadChunks();
  }

  loadChunks() {
    if (window.localStorage.getItem(stash) == null) {
      return [];
    } else {
      return load();
    }
  }

  updateOnNotification() {
    // nop
  }

  useChunks() {
    const [updateAt, setUpdateAt] = useState(0);
    const chunks = useMemo(() => this.chunks, [updateAt]);

    const add = (i?, chunkContent?) => {
      i = i ?? chunks.length;

      const id = uuidv4();
      const chunk = chunkContent ?? {
        id: id,
        type: "text",
        content: "",
      };

      const nc = chunks.slice();
      nc.splice(i, 0, chunk);
      this.chunks = nc;
      setUpdateAt(updateAt + 1);
      save(this.chunks);
    };

    const create = (i?) => {
      add(i);
    };

    const addFromText = (i?, text) => {
      add(i, { type: "text", content: text });
    };

    const del = (id) => {
      const i = chunks.findIndex((c) => c.id === id);
      if (i < 0) return "";

      const nc = chunks.slice();
      nc.splice(i, 1);
      this.chunks = nc;
      setUpdateAt(updateAt + 1);
      save(this.chunks);
    };

    const move = (id, pos) => {
      const i = chunks.findIndex((c) => c.id === id);

      const nc = chunks.slice();
      const chunk = nc[i];
      nc.splice(i, 1);
      nc.splice((pos >= i) ? pos - 1 : pos, 0, chunk);
      this.chunks = nc;
      setUpdateAt(updateAt + 1);
      save(this.chunks);
    };

    return [chunks, { add, create, addFromText, del, move }];
  }

  useTags() {
    return [[], () => Promise.resolve()];
  }

  useChunk(orig_chunk) {
    const [updateAt, setUpdateAt] = useState(0);
    const chunk = useMemo(() => orig_chunk, [updateAt]);

    const updateChunk = () => {
      setUpdateAt(updateAt + 1);
      save(this.chunks);
    };

    const setType = (t) => {
      orig_chunk.type = t;
      updateChunk();
    };

    const setContent = (content: string) => {
      orig_chunk.content = content;
      updateChunk();
    };

    return [chunk, { setType, setContent }];
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
          position: "sticky",
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
              }}
            >
              <ChunkList doc={doc} />
            </Paper>
          </Zoom>
        </ClickAwayListener>
      </Popper>
    </>
  );
}

export default Stash;

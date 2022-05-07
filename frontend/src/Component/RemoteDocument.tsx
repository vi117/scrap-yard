import { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { chunkCreate, chunkDelete, chunkModify, chunkMove } from "../Model/chunk";
import { closeDocument, openDocument } from "../Model/Document";
import { RPCMessageManager } from "../Model/RPCManager";

const url = "ws://localhost:8000/ws";
const path = "test.syd";

const manager = new RPCMessageManager();
await manager.open(url);

export function newDocument() {
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    if (!doc) getDoc();
  });

  const getDoc = async () => {
    const d = await openDocument(manager, path);
    setDoc(d);
  };

  return doc;
}

export function useChunks(doc) {
  const [chunks, setChunks] = useState(doc.chunks);

  const add = async (i?, chunkContent?) => {
    i = i ?? chunks.length;

    chunkContent = chunkContent ?? {
      type: "text",
      text: "",
    };

    const ps = {
      docPath: doc.docPath,
      position: i,
      chunkId: uuidv4(),
      chunkContent: chunkContent,
    };

    const nc = chunks.slice();
    nc.splice(i, 0, { ...chunkContent, id: ps.chunkId });
    setChunks(nc);
    // FIXME: this sends requests, but reutrns error.
    await chunkCreate(manager, ps);
  };

  const create = async (i?) => {
    await add(i);
  };

  const addFromText = async (i?, text) => {
    await add(i, { type: "text", content: text });
  };

  const del = async (id) => {
    const ps = {
      docPath: doc.docPath,
      chunkId: id,
    };

    const i = chunks.findIndex((c) => c.id === id);
    const nc = chunks.slice();
    nc.splice(i, 1);
    setChunks(nc);
    await chunkDelete(manager, ps);
  };

  const move = async (id, pos) => {
    const ps = {
      docPath: doc.docPath,
      chunkId: id,
      position: pos,
    };

    const i = chunks.findIndex((c) => c.id === id);
    const chunk = chunks[i];
    const nc = chunks.slice();
    nc.splice(i, 1);
    nc.splice((pos <= i) ? pos : pos - 1, 0, chunk);
    setChunks(nc);
    await chunkMove(manager, ps);
  };

  return [chunks, { create, del, move, addFromText }];
}

export function useTags(doc) {
  const [get, set] = useState(doc.tags);

  const setTags = async (tags) => {
    set(tags);
    // TODO: update tags to server
  };

  return [get, setTags];
}

export function useChunk(docPath, chunkData) {
  const [chunk, setChunk] = useState(chunkData);

  const updateChunk = async (nchunk) => {
    const ps = {
      docPath: docPath,
      chunkId: chunk.id,
      chunkContent: nchunk as ChunkModifyParam,
    };

    setChunk(nchunk);
    chunkData = nchunk;
    await chunkModify(manager, ps);
  };

  const setType = async (t) => {
    const nchunk = { ...chunk, type: t };
    await updateChunk(nchunk);
  };

  const setContent = async (c) => {
    const nchunk = { ...chunk, content: c };
    await updateChunk(nchunk);
  };

  return [chunk, { setType, setContent }];
}

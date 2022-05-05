import { useEffect, useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { openDocument, closeDocument } from '../Model/Document';
import { RPCMessageManager } from '../Model/RPCManager';
import { chunkCreate, chunkDelete } from '../Model/chunk';

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
  }

  return doc;
}

export function useChunks(doc) {
  const [chunks, setChunks] = useState(doc.chunks);

  const create = async (i?) => {
    i = i ?? chunks.length;

    const chunkContent = {
        type: "text",
        text: ""
    }

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
    console.log("request sent");
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
    console.log("request sent");
  };

  // TODO: do this after implmenting drag&drop
  /*
     const move = () => {
     };
   */

  return [chunks, {create, del}];
}

export function useChunk(doc, chunk) {

  return [chunk, {type, content}];
}

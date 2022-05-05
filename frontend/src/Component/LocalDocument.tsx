// persistent document using LocalStorage
// WARN: this module is only for debugging. do not use it in production.

import { useState, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

function save(doc) {
    window.localStorage.setItem("local", JSON.stringify(doc));
}

function load() {
    return JSON.parse(window.localStorage.getItem("local"));
}

// return new Document.
export function newDocument() {
    if (window.localStorage.getItem("local") == null) {
        return { chunks: [], tags: [] };
    } else {
        return load();
    }
}

// return React hook and commands that update status of chunk list of document.
export function useChunks(doc) {
    //const [chunks, setChunks] = useState(doc.chunks);
    const [updateAt, setUpdateAt] = useState(0);
    const chunks = useMemo(() => doc.chunks, [updateAt]);

    const create = (i?) => {
        i = i ?? chunks.length;
        const id  = uuidv4();
        const chunk = {
            id: id,
            type: "text",
            content: "",
        };

        const nc = chunks.slice();
        nc.splice(i, 0, chunk);
        doc.chunks = nc;
        setUpdateAt(updateAt + 1);
        save(doc);
    }

    const del = (id) => {
        const i = chunks.findIndex((c) => c.id === id);
        if (i < 0) return "";

        const nc = chunks.slice();
        nc.splice(i, 1);
        doc.chunks = nc;
        setUpdateAt(updateAt + 1);
        save(doc);
    };

    return [chunks, {create, del}];
}

// return React hooks content and type.
export function useChunk(doc, chunk) {
    const [content, setContent] = useState(chunk.content);
    const [type, setType] = useState(chunk.type);

    useEffect(() => {
        chunk.content = content;
        chunk.type = type;
        save(doc);
    }, [content, type]);

    return [content, type, setContent, setType];
}

// tag
export function useTags(doc) {
    const [tags, setTags] = useState(doc.tags);

    const setT = (ts) => {
        setTags(ts);
        doc.tags = ts;
        save(doc);
    };

    return [tags, setT];
}

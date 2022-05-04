import { useState, useEffect } from 'react';

function save(doc) {
    window.localStorage.setItem("local", JSON.stringify(doc));
}

function load() {
    return JSON.parse(window.localStorage.getItem("local"));
}

export function newLocalDocument() {
    if (window.localStorage.getItem("local") == null) {
        return { chunks: [], tags: [] };
    } else {
        return load();
    }
}

export function useChunks(doc) {
    const [chunks, setChunks] = useState(doc.chunks);

    const addChunk = (id?, offset, chunk) => {
        if (offset != 0 && offset != 1) return "";

        const i = id ? chunks.findIndex((c) => c.id === id) : chunks.length;
        if (i < 0) return "";

        const nc = chunks.slice();
        nc.splice(i + offset, 0, chunk);
        setChunks(nc);
        doc.chunks = nc;
        save(doc);

        return id;
    };

    const deleteChunk = (id) => {
        const i = chunks.findIndex((c) => c.id === id);
        if (i < 0) return "";

        const nc = chunks.slice();
        nc.splice(i, 1);
        setChunks(nc);
        doc.chunks = nc;
        save(doc);

        return id;
    };

    return [chunks, {addChunk, deleteChunk}];
}

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

export function useTags(doc) {
    const [tags, setTags] = useState(doc.tags);

    const setT = (ts) => {
        setTags(ts);
        doc.tags = ts;
        save(doc);
    };

    return [tags, setT];
}

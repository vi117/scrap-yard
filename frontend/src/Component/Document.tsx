import { Button, Stack } from "@mui/material";
import { Fragment, useEffect } from "react";
import { atom, RecoilState, useRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
import { newLocalDocument, useChunks } from "./LocalDocument";

// import '../App.css';
import Chunk from "./Chunk";

/*
const uuidList: RecoilState<string[]> = atom({
  key: "uuid List",
  default: [] as string[],
});

const chunkMap = new Map();
 */

const focusedChunk = atom({
  key: "Focused Chunk",
  default: "",
});

export function DocumentEditor() {
  const doc = newLocalDocument();
  const [chunks, {addChunk, deleteChunk}] = useChunks(doc);

  const newChunk = (i?: number) => {
    i = i ?? chunks.length;
    const id = (i == chunks.length) ? null : chunks[i].id;
    const nid = uuidv4();

    addChunk(id, 0, {
      id: nid,
      type: "text",
      content: "",
    });
  };

  const chunklist = chunks.map((chunk, i) => {
    const id = chunk.id;
    return (
      <Fragment key={id}>
        <Button onClick={() => newChunk(i)}>add to {i}</Button>
          <Chunk
            doc={doc}
            chunk={chunk}
            focusedChunk={focusedChunk}
            deleteThis={() => deleteChunk(id)}
          />
      </Fragment>
    );
  });

  return (
    <Stack className="document" spacing={2}>
      {chunklist}
      <Button onClick={() => newChunk()}>Add</Button>
    </Stack>
  );
}

export default DocumentEditor;

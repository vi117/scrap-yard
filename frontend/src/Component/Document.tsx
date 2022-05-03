import { Button, Paper, Stack } from "@mui/material";
import { Fragment } from "react";
import { atom, atomFamily, RecoilState, useRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
import { IDocument } from "../Model/Document";

// import '../App.css';
import Chunk from "./Chunk";

const uuidList: RecoilState<string[]> = atom({
  key: "uuid List",
  default: [] as string[],
});

const chunkMap = new Map();

const focusedChunk = atom({
  key: "Focused Chunk",
  default: "",
});

// collecting texts of chunks by using selector
/*
const allTextState = selector({
  key: 'Chunk Texts',
  get: ({get}) => {
  return get(uuidList).map((id) => get(contentFamily(id)));
  }
});
 */

export function DocumentEditor() {
  const [UUIDs, setUUIDs] = useRecoilState(uuidList);

  const newChunk = (i?: number) => {
    i = i ?? UUIDs.length;
    const id = uuidv4();

    chunkMap.set(id, {
      id: id,
      type: "text",
      content: "",
    });

    const nids = UUIDs.slice();
    nids.splice(i, 0, id);
    setUUIDs(nids);
  };

  const delChunk = (i: number) => {
    // const id = UUIDs[i];
    const nids = UUIDs.slice();
    nids.splice(i, 1);
    setUUIDs(nids);
  };

  const deleteByUUID = (id: string) => {
    const i = UUIDs.findIndex((i) => i == id);
    delChunk(i);
  };

  const chunklist = UUIDs.map((id, i) => {
    const chunk = chunkMap.get(id);
    return (
      <Fragment key={id}>
        <Button onClick={() => newChunk(i)}>add to {i}</Button>
        <Paper key={id}>
          <Chunk
            chunk={chunk}
            focusedChunk={focusedChunk}
            deleteThis={() => deleteByUUID(id)}
          />
        </Paper>
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

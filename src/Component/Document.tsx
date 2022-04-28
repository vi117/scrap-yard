import { Button, Paper, Stack } from "@mui/material";
import { Fragment, useState } from "react";
import { atom, atomFamily, RecoilState, selector, useRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";

// import '../App.css';
import Chunk from "./Chunk";

const uuidList: RecoilState<int[]> = atom({
  key: "uuid List",
  default: [],
});

const contentFamily = atomFamily({
  key: "contents",
  default: "",
});

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

const Document = () => {
  const [UUIDs, setUUIDs] = useRecoilState(uuidList);

  const newChunk = (i?: number) => {
    i = i ?? UUIDs.length;
    const id = uuidv4();
    const nids = UUIDs.slice();
    nids.splice(i, 0, id);
    setUUIDs(nids);
  };

  const delChunk = (i: number) => {
    const id = UUIDs[i];
    const nids = UUIDs.slice();
    nids.splice(i, 1);
    setUUIDs(nids);
  };

  const chunklist = UUIDs.map((id, i) => {
    const content = contentFamily(id);
    return (
      <Fragment key={id}>
        <Button onClick={() => newChunk(i)}>add to {i}</Button>
        <Paper key={id}>
          <Chunk id={id} content={content} focusedChunk={focusedChunk} />
          <Button onClick={() => delChunk(i)}>delete</Button>
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
};

export default Document;

import { Button, Chip, Input, Stack } from "@mui/material";
import { Fragment, useEffect, useRef, useState } from "react";
import { atom, RecoilState, useRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
// import { newDocument, useChunks } from "./LocalDocument";
import { newDocument, useChunks, useTags } from "./RemoteDocument";

// import '../App.css';
import Chunk from "./Chunk";
import Divider from "./Divider";

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

function TagBar(props: { doc: Document }) {
  const [tags, setTags] = useTags(props.doc);
  const [taglist, setTaglist] = useState(tags.join(" "));
  const [editable, setEditable] = useState(false);

  const update: FormEventHandler = (e) => {
    e.preventDefault();
    const ntags = taglist.split(" ");
    setTags(ntags);
    setEditable(false);
  };

  const onChange = (e) => setTaglist(e.target.value);

  if (editable) {
    return (
      <form onSubmit={update}>
        <Input type="text" onChange={onChange} value={taglist} />
        <Input type="submit" value="Set" />
      </form>
    );
  } else {
    return (
      <>
        <Stack direction="row" spacing={1}>
          {tags.map((tag, i) => <Chip key={i} label={tag} />)}
          <Button onClick={() => setEditable(true)}>Edit</Button>
        </Stack>
      </>
    );
  }
}

function Doc(props: { doc: Document }) {
  const doc = props.doc;
  const [chunks, setChunks] = useChunks(doc);

  const chunklist = chunks.map((chunk, i) => {
    const id = chunk.id;
    return (
      <Fragment key={id}>
        <Divider
          position={i}
          newChunk={setChunks.create}
          moveChunk={setChunks.move}
          addFromText={setChunks.addFromText}
        />

        <Chunk
          doc={doc}
          chunk={chunk}
          focusedChunk={focusedChunk}
          deleteThis={() => setChunks.del(id)}
        />
      </Fragment>
    );
  });

  return (
    <>
      <TagBar doc={doc} />
      <Stack className="document" spacing={2}>
        {chunklist}
        <Divider
          position={chunks.length}
          newChunk={setChunks.create}
          moveChunk={setChunks.move}
          addFromText={setChunks.addFromText}
        />
      </Stack>
    </>
  );
}

export function DocumentEditor() {
  const doc = newDocument();

  if (doc != null) {
    return <Doc doc={doc} />;
  } else {
    return <div>please wait...</div>;
  }
}

export default DocumentEditor;

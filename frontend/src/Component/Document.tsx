import { Button, Chip, Input, Stack } from "@mui/material";
import { FormEventHandler, Fragment, useState } from "react";
import { atom, RecoilState, useRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
// import { newDocument, useChunks } from "./LocalDocument";
import { createTestDocViewModel, DocumentViewModel } from "../ViewModel/doc";

// import '../App.css';
import { DocumentObject } from "model";
import Chunk from "./Chunk";
import Divider from "./Divider";

/*
const uuidList: RecoilState<string[]> = atom({
  key: "uuid List",
  default: [] as string[],
});

const chunkMap = new Map();
 */

// TODO(vi117): remove this and make chunk view model.
const focusedChunk = atom({
  key: "Focused Chunk",
  default: "",
});

function TagBar(props: { doc: DocumentViewModel }) {
  const [tags, setTags] = props.doc.useTags();
  const [taglist, setTaglist] = useState(tags.join(" "));
  const [editable, setEditable] = useState(false);

  const update: FormEventHandler = (e) => {
    e.preventDefault();
    const ntags = taglist.split(" ").filter((s) => s != "");

    setTags(ntags);
    setEditable(false);
  };

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => setTaglist(e.target.value);

  if (editable) {
    return (
      <form onSubmit={update}>
        <Input type="text" onChange={onChange} value={taglist} />
        <Input type="submit" value="Set" />
      </form>
    );
  } else {
    return (
      <Stack direction="row" spacing={1}>
        {tags.map((tag, i) => <Chip key={i} label={tag} />)}
        <Button onClick={() => setEditable(true)}>Edit</Button>
      </Stack>
    );
  }
}

function Doc(props: { doc: DocumentViewModel }) {
  const doc = props.doc;
  const [chunks, mutation] = doc.useChunks();

  const chunklist = chunks.map((chunk, i) => {
    const id = chunk.id;
    return (
      <Fragment key={id}>
        <Divider
          position={i}
          newChunk={mutation.create}
          moveChunk={mutation.move}
          addFromText={mutation.addFromText}
        />

        <Chunk
          doc={doc}
          chunk={chunk}
          focusedChunk={focusedChunk}
          deleteThis={() => mutation.del(id)}
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
          newChunk={mutation.create}
          moveChunk={mutation.move}
          addFromText={mutation.addFromText}
        />
      </Stack>
    </>
  );
}

export function DocumentEditor() {
  const doc = createTestDocViewModel("ws://localhost:8000/ws", "test.syd");

  if (doc != null) {
    return <Doc doc={doc} />;
  } else {
    return <div>please wait...</div>;
  }
}

export default DocumentEditor;

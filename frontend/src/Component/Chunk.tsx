import { Button, Grid, Input, Paper, TextField } from "@mui/material";
import { ChangeEventHandler, createRef, FormEventHandler, useEffect, useState } from "react";
import { useDrag } from "react-dnd";
import { RecoilState, useRecoilState } from "recoil";
import csvRenderer from "./csvRenderer";
import markdownRenderer from "./markdownRenderer";
import { useChunk } from "./RemoteDocument";

function render_view(t: string, content: string) {
  switch (t) {
    case "text":
      return <>{content}</>;
    case "csv":
      return csvRenderer(content);
    case "md":
      return markdownRenderer(content);
    default:
      return <>error: invalid type: {t} content: {content}</>;
  }
}

const TypeForm = (props: {
  value: string;
  update: (t: string) => void;
}) => {
  const [input, setInput] = useState(props.value);

  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => setInput(e.target.value);

  const update: FormEventHandler = (e) => {
    e.preventDefault();
    props.update(input);
  };

  return (
    <form onSubmit={update}>
      <label>
        type:
        <Input type="text" value={input} onChange={onChange} />
      </label>
      <Input type="submit" value="change" />
    </form>
  );
};

const Chunk = (props: {
  doc;
  chunk: Chunk;
  focusedChunk: RecoilState<string>;
  deleteThis: () => void;
}) => {
  const docPath = props.doc.docPath;
  const chunkData = props.chunk;
  const id = chunkData.id;
  const deleteThis = props.deleteThis;

  // Inherited States
  const [fc, setFc] = useRecoilState(props.focusedChunk);
  const [{ type, content }, { setType, setContent }] = useChunk(docPath, chunkData);
  const [buffer, setBuffer] = useState(content);

  // Internal States
  const [mode, setMode] = useState("Read");
  const [onDelete, setOnDelete] = useState(false);

  // drag
  const [, drag] = useDrag(() => ({
    type: "chunk", // TODO: make this constant
    item: { id: id },
  }));

  // reference of textfield
  const inputRef = createRef<null | HTMLTextAreaElement>();

  // Effects

  // set read mode when other chunk gets focused.
  useEffect(() => {
    if (fc != id) setMode("Read");
  }, [fc]);

  useEffect(() => {
    const ref = inputRef.current;
    if (mode == "Write" && ref != null) {
      // move cursor to the end of the content when in write mode.
      const last = ref.value.length;
      ref.setSelectionRange(last, last);
    } else if (mode == "Read") {
      // save content when user stops writing.
      setContent(buffer);
    }
  }, [mode]);

  // Callbacks

  const changeMode = () => setMode(mode == "Read" ? "Write" : "Read");

  const updateType = (t: string) => {
    // TODO: update chunk type here.
    setType(t);
  };

  const onChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => setBuffer(e.target.value);

  const onFocus = () => setFc(id);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key == "Backspace") {
      if (!onDelete && e.target.value == "") {
        deleteThis();
      } else {
        setOnDelete(true);
      }
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key == "Backspace") setOnDelete(false);
  };

  const renderContent = () => {
    if (mode == "Read") {
      return <div id="content" className="content">{render_view(type, content)}</div>;
    } else { // edit mode
      // TODO: change this to proper editor
      return (
        <TextField
          id="content"
          autoFocus={true}
          multiline
          fullWidth={true}
          minRows={4}
          className="content"
          inputRef={inputRef}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          value={buffer}
        />
      );
    }
  };

  const editButton = (
    <Button onClick={changeMode}>
      {mode == "Read" ? "Edit" : "Save"}
    </Button>
  );

  return (
    <Paper ref={(mode == "Read") ? drag : null} key={id} sx={{ padding: "1em" }}>
      <Grid container direction="column" spacing={1} onFocus={onFocus} className="chunk">
        <Grid item xs={12}>
          <TypeForm value={type} update={updateType} />
        </Grid>
        <Grid container xs={12} direction="row" spacing={1} className="chunk-inner">
          <Grid item xs={11}>{renderContent()}</Grid>
          <Grid container xs={1} direction="column" spacing={0}>
            <Grid item>{editButton}</Grid>
            <Grid item>
              <Button onClick={deleteThis}>Delete</Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default Chunk;

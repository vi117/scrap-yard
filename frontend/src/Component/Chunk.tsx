import DeleteIcon from "@mui/icons-material/Delete";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import EditIcon from "@mui/icons-material/Edit";
import MenuIcon from "@mui/icons-material/Menu";
import SaveIcon from "@mui/icons-material/Save";
import { Autocomplete, Button, Dialog, DialogTitle, Grid, Input, Paper, TextField, Tooltip } from "@mui/material";
import { Chunk as ChunkType } from "model";
import React, { ChangeEventHandler, createRef, FormEventHandler, useEffect, useRef, useState } from "react";
import { useDrag } from "react-dnd";
import { RecoilState, useRecoilState } from "recoil";
import { DocumentViewModel } from "../ViewModel/doc";
import csvRenderer from "./Chunk/csvRenderer";
import markdownRenderer from "./Chunk/markdownRenderer";

const types = [
  "text",
  "csv",
  "md",
];

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

const TypeDialog = (props: {
  open: boolean;
  onClose: (t: string) => void;
  value: string;
}) => {
  const inputRef = useRef(null);

  const update = () => {
    props.onClose(inputRef.current.value);
  };

  return (
    <Dialog
      style={{ padding: "1em" }}
      open={props.open}
      onClose={update}
    >
      <DialogTitle>Set chunk type</DialogTitle>
      <Autocomplete
        options={types}
        sx={{ width: 300 }}
        renderInput={(param) => <TextField {...param} inputRef={inputRef} type="text" label="type" />}
      />
      <Input type="button" value="change" onClick={update} />
    </Dialog>
  );
};

const Chunk = (props: {
  doc: DocumentViewModel;
  chunk: ChunkType;
  focusedChunk: RecoilState<string>;
  deleteThis: () => void;
}) => {
  const chunk = props.chunk;
  const id = chunk.id;
  const deleteThis = props.deleteThis;

  // Inherited States
  const [fc, setFc] = useRecoilState(props.focusedChunk);
  const [{ type, content }, { setType, setContent }] = props.doc.useChunk(chunk);
  const [buffer, setBuffer] = useState(content);

  // Internal States
  const [mode, setMode] = useState("Read");
  const [onDelete, setOnDelete] = useState(false);

  // Tag Dialog States
  const [tOpen, setTOpen] = useState(false);

  // drag
  const [, drag, preview] = useDrag(() => ({
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
    console.log("updateType", t);
    // TODO: update chunk type here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setType(t as any);
    setTOpen(false);
  };

  const onChange: ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement> = (e) => setBuffer(e.target.value);

  const onFocus = () => setFc(id);

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key == "Backspace") {
      if (!onDelete && buffer == "") {
        deleteThis();
      } else {
        setOnDelete(true);
      }
    }
  };

  const onKeyUp: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key == "Backspace") setOnDelete(false);
  };

  const renderContent = () => {
    if (mode == "Read") {
      return (
        <div id="content" className="content" style={{ minHeight: "8em" }}>
          {render_view(type, content)}
        </div>
      );
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
    <Tooltip title={mode == "Read" ? "Edit" : "Save"}>
      <Button onClick={changeMode}>
        {mode == "Read" ? <EditIcon /> : <SaveIcon />}
      </Button>
    </Tooltip>
  );

  const deleteButton = (
    <Tooltip title="Delete">
      <Button onClick={deleteThis}>
        <DeleteIcon />
      </Button>
    </Tooltip>
  );

  const typeDialogButton = (
    <>
      <Tooltip title="chunk type">
        <Button onClick={() => setTOpen(true)}>{type}</Button>
      </Tooltip>
      <TypeDialog open={tOpen} onClose={updateType} value={type} />
    </>
  );

  return (
    <Paper
      id={"chunk-" + id}
      key={id}
      ref={(mode == "Read") ? drag : null}
      style={{
        margin: "0.5em",
        padding: "0.5em",
      }}
    >
      <Grid container direction="row" spacing={1} onFocus={onFocus}>
        {/* content */}
        <Grid item xs={11} onClick={() => setMode("Write")}>
          {renderContent()}
        </Grid>

        {/* sidebar */}
        <Grid item xs={1}>
          {editButton}
          {deleteButton}
          {typeDialogButton}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default Chunk;

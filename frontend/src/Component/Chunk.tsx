import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { Button, Grid, InputLabel, MenuItem, Paper, Select, TextField, Tooltip } from "@mui/material";
import { Chunk as ChunkType } from "model";
import React, { ChangeEventHandler, createRef, useEffect, useState } from "react";
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

const TypeSelector = (props: {
  update: (t: string) => void;
  value: string;
}) => {
  const update = (event) => {
    props.update(event.target.value as string);
  };

  return (
    <>
      <InputLabel id="typeselector-label">Type</InputLabel>
      <Select
        labelId="typeselector-label"
        id="typeselector"
        value={props.value}
        label="Type"
        onChange={update}
      >
        {types.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
      </Select>
    </>
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
    if (t != "") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setType(t as any);
    }
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

  const typeSelector = <TypeSelector update={updateType} value={type} />;

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
          {typeSelector}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default Chunk;

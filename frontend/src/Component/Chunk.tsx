import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { Button, Grid, InputLabel, MenuItem, Paper, Select, TextField, Tooltip } from "@mui/material";
import { Chunk as ChunkType } from "model";
import React, { ChangeEventHandler, createRef, useEffect, useState } from "react";
import { RecoilState, useRecoilState } from "recoil";
import { ChunkViewModel } from "../ViewModel/chunklist";
import { IDocumentViewModel } from "../ViewModel/doc";

import CsvRenderer from "./Chunk/csvRenderer";
import MarkdownRenderer from "./Chunk/markdownRenderer";
import { useDrag } from "./dnd";

const types = [
  "text",
  "csv",
  "md",
  "rawhtml",
  "image",
  "video",
  "audio",
];

export function render_view(t: string, content: string) {
  switch (t) {
    case "text":
      return <>{content}</>;
    case "csv":
      return <CsvRenderer content={content} />;
    case "md":
      return <MarkdownRenderer text={content} />;
    case "image":
      return <img src={content} />;
    case "video":
      return <video src={content} />;
    case "audio":
      return <audio src={content} />;
    case "rawhtml":
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    default:
      return <>error: invalid type: {t} content: {content}</>;
  }
}

const TypeSelector = (props: {
  update: (t: string) => void;
  value: string;
}) => {
  const update = (event: { target: { value: string } }) => {
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
  chunk: ChunkViewModel;
  position: number;
  deleteThis: () => void;
}) => {
  const chunk = props.chunk;
  const id = chunk.id;
  const deleteThis = props.deleteThis;

  const [{ type, content }, { setType, setContent }] = props.chunk.useChunk();
  const [buffer, setBuffer] = useState(content);

  // Internal States
  const [mode, setMode] = useState<"Read" | "Write">("Read");
  const [onDelete, setOnDelete] = useState(false);

  // drag
  const [, drag] = useDrag(() => ({
    type: "chunk", // TODO: make this constant
    item: { chunk: chunk.chunk, doc: props.chunk.parent.docPath, cur: props.position },
    end: () => {
      // TODO: need to fill dragend.
    },
  }), [props.position]);

  // reference of textfield
  const inputRef = createRef<null | HTMLTextAreaElement>();
  const fc = chunk.useFocus();
  // Effects
  // set read mode when other chunk gets focused.
  useEffect(() => {
    if (!fc) {
      setMode("Read");
    } else {
      setMode("Write");
    }
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

  const changeMode = () => {
    setMode(mode == "Read" ? "Write" : "Read");
  };

  const updateType = (t: string) => {
    if (t != "") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setType(t as any);
    }
  };

  const onChange: ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement> = (e) => setBuffer(e.target.value);

  const onFocus = () => chunk.focus();

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
        <div id="content" className="content" style={{ height: "100%" }}>
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
          minRows="5"
          className="content"
          inputRef={inputRef}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          value={buffer}
          sx={{ height: "100%" }}
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
      <div style={{ display: "flex", flexDirection: "row", gap: "0.5em" }} onFocus={onFocus}>
        {/* content */}
        <div style={{ width: "100%" }} onClick={() => setMode("Write")}>
          {renderContent()}
        </div>

        {/* sidebar */}
        <div>
          {editButton}
          {deleteButton}
          {typeSelector}
        </div>
      </div>
    </Paper>
  );
};

export default Chunk;

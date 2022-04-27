import { Button, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { RecoilState, useRecoilState } from "recoil";
// import '../App.css';

type Mode = "Read" | "Write";

function render_view(_t: string, content: string) {
  return content;
}

const Chunk = (props: {
  id: string;
  content: RecoilState<string>;
  focusedChunk: RecoilState<string>;
}) => {
  const [content, setContent] = useRecoilState(props.content);
  const [fc, setFc] = useRecoilState(props.focusedChunk);
  const [type, _setType] = useState("text");
  const [mode, setMode] = useState("Read");

  // Effect
  useEffect(() => {
    if (fc != props.id) setMode("Read");
  }, [fc]);

  // Callbacks

  const onChange = (e) => setContent(e.target.value);

  const changeMode = () => setMode(mode == "Read" ? "Write" : "Read");

  const onFocus = () => setFc(props.id);

  // const onBlur = (e) => { }; // for later use

  const renderContent = () => {
    if (mode == "Read") {
      return (
        <div id="content" className="content">
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
          className="content"
          onChange={onChange}
          value={content}
        >
        </TextField>
      );
    }
  };

  const editButton = (
    <Button onClick={changeMode}>
      {mode == "Read" ? "Edit" : "Save"}
    </Button>
  );

  return (
    <div onFocus={onFocus} /* onBlur={onBlur} */ className="chunk">
      {renderContent()}
      {editButton}
    </div>
  );
};

export default Chunk;

// vim: sw=2 ts=2

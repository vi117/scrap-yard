import { Button, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { RecoilState, useRecoilState } from "recoil";
import csvRenderer from "../csvRenderer";

type Mode = "Read" | "Write";

function render_view(t: string, content: string) {
  switch (t) {
    case "text":
      return <>{content}</>;
    case "csv":
      return csvRenderer(content);
    default:
      return <>error: invalid type: {t} content: {content}</>;
  }
}

const TypeForm = (props: {
  value: string;
  update: (t: string) => void;
}) => {
  const [input, setInput] = useState(props.value);

  const onChange = (e) => setInput(e.target.value);

  const update = (e) => {
    e.preventDefault();
    props.update(input);
  };

  return (
    <form onSubmit={update}>
      <label>
        type:
        <input type="text" value={input} onChange={onChange} />
      </label>
      <input type="submit" value="change" />
    </form>
  );
};

const Chunk = (props: {
  id: string;
  content: RecoilState<string>;
  focusedChunk: RecoilState<string>;
}) => {
  const [content, setContent] = useRecoilState(props.content);
  const [fc, setFc] = useRecoilState(props.focusedChunk);
  const [type, setType] = useState("text");
  const [mode, setMode] = useState("Read");

  // Effect
  useEffect(() => {
    // set read mode when other chunk gets focused.
    if (fc != props.id) setMode("Read");
  }, [fc]);

  // Callbacks

  const onChange = (e) => setContent(e.target.value);

  const changeMode = () => setMode(mode == "Read" ? "Write" : "Read");

  const onFocus = () => setFc(props.id);

  const updateType = (t) => setType(t);

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
          minRows={4}
          className="content"
          onChange={onChange}
          value={content}
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
    <Stack onFocus={onFocus} /* onBlur={onBlur} */ className="chunk">
      <TypeForm value={type} update={updateType} />
      <Stack direction="row" className="chunk-inner">
        {renderContent()}
        {editButton}
      </Stack>
    </Stack>
  );
};

export default Chunk;

// vim: sw=2 ts=2

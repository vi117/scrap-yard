// Divider sits inbetween chunks, and is a place for a new chunk to spawn or old to drop on.

import { Box, Button } from "@mui/material";
import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";
import * as ReactDOMServer from "react-dom/server";

export function Divider(props: {
  position: number;
  newChunk: (pos: number) => void;
  moveChunk: (id: string, pos: number) => void;
  addFromText: (pos: number, content: string) => void;
}) {
  const { position, newChunk, moveChunk, addFromText } = props;
  // TODO(vi117): add proper type
  const [{ isOver }, drop] = useDrop<{ id: string } & { text: string } & { html: string }>(
    () => ({
      accept: ["chunk", NativeTypes.TEXT, NativeTypes.HTML],
      drop: (item, monitor) => {
        const t = monitor.getItemType();
        if (t == "chunk") {
          moveChunk(item.id, position);
        } else if (t == NativeTypes.TEXT) {
          addFromText(position, item.text);
        } else if (t == NativeTypes.HTML) {
          // TODO: add proper html to text processing.
          const stripped = item.html.replace(/<[^>]+>/g, "");
          const text = ReactDOMServer.renderToString(stripped);
          addFromText(position, text);
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }),
  );

  return (
    <Box
      ref={drop}
      sx={isOver && { background: "grey" }}
    >
      <Button fullWidth={true} onClick={() => newChunk(position)}>Add</Button>
    </Box>
  );
}

export default Divider;

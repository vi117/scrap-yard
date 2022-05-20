// Divider sits inbetween chunks, and is a place for a new chunk to spawn or old to drop on.

import AddIcon from "@mui/icons-material/Add";
import { Box, IconButton } from "@mui/material";
import * as ReactDOMServer from "react-dom/server";
import { RecoilState, useRecoilState } from "recoil";
import { useDrop } from "./dnd";

import { Chunk as ChunkType, ChunkContent } from "./model";

export function Divider(props: {
  doc: string;
  position: number;
  newChunk: (pos: number) => void;
  insertChunk: (pos: number, chunk: ChunkType) => void;
  moveChunk: (id: string, pos: number) => void;
  addFromText: (pos: number, content: string) => void;
  add: (pos: number, content: ChunkContent) => void;
}) {
  const { position, newChunk, insertChunk, moveChunk, addFromText, add } = props;

  const [{ isOver }, drop] = useDrop<
    { chunk: ChunkType; doc: string; cur: number } & { text: string } & { html: string }
  >(
    () => ({
      accept: ["chunk", "text/html", "text/plain"],
      drop: (t, item) => {
        if (t == "chunk") {
          if (item.doc == props.doc) { // in-document move
            // prevent unnecessary move
            if (!(item.cur == position - 1 || item.cur == position)) {
              moveChunk(item.chunk.id, position);
            }
          } else { // document-by-document move
            // TODO: need to test this (dnd doc-by-doc).
            insertChunk(position, { type: item.chunk.type, content: item.chunk.content });
          }
        } else if (t == "text/plain") {
          addFromText(position, item);
        } else if (t == "text/html") {
          add(position, {
            type: "rawhtml",
            content: item.html,
          });
        }
      },
    }),
    [position],
  );

  return (
    <Box
      ref={drop}
      sx={{
        display: "flex",
        ...(isOver ? { background: "grey" } : {}), // TODO: change color & move this outside
      }}
    >
      <IconButton style={{ margin: "0 auto" }} onClick={() => newChunk(position)}>
        <AddIcon />
      </IconButton>
    </Box>
  );
}

export default Divider;

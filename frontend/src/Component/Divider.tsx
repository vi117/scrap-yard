// Divider sits inbetween chunks, and is a place for a new chunk to spawn or old to drop on.

import AddIcon from "@mui/icons-material/Add";
import { Box, Button } from "@mui/material";
import { ChunkContent } from "model";
import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";

type CollectedProps = {
  isOver: boolean;
};

export function Divider(props: {
  position: number;
  newChunk: (pos: number) => void;
  moveChunk: (id: string, pos: number) => void;
  addFromText: (pos: number, content: string) => void;
  add: (pos: number, content: ChunkContent) => void;
}) {
  const { position, newChunk, moveChunk, addFromText, add } = props;
  const [{ isOver }, drop] = useDrop<{ id: string } & { text: string } & { html: string }, void, CollectedProps>(
    () => ({
      accept: ["chunk", NativeTypes.TEXT, NativeTypes.HTML],
      drop: (item, monitor) => {
        const t = monitor.getItemType();
        if (t == "chunk") {
          moveChunk(item.id, position);
        } else if (t == NativeTypes.TEXT) {
          addFromText(position, item.text);
        } else if (t == NativeTypes.HTML) {
          add(position, {
            type: "rawhtml",
            content: item.html,
          });
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }),
    [position],
  );

  return (
    <Box
      ref={drop}
      sx={isOver ? { background: "grey" } : {}}
    >
      <Button fullWidth={true} onClick={() => newChunk(position)}>
        <AddIcon />
      </Button>
    </Box>
  );
}

export default Divider;

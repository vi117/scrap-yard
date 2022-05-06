// Divider sits inbetween chunks, and is a place for a new chunk to spawn or old to drop on.

import { Box, Button } from "@mui/material";
import { useDrop } from "react-dnd";

export function Divider(props: {
  position: number;
  newChunk: () => void;
  moveChunk: (number) => void;
}) {
  const { position, newChunk, moveChunk } = props;

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "chunk",
      drop: ({ id }) => {
        moveChunk(id, position);
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
      sx={isOver && { background: "grey" }}
    >
      <Button onClick={() => newChunk(position)}>Add</Button>
    </Box>
  );
}

export default Divider;

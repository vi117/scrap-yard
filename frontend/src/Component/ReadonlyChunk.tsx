import { Box } from "@mui/material";
import { IChunkViewModel } from "../ViewModel/chunklist";
import renderView from "./Renderer/mod";

export function ReadonlyChunk(props: {
    chunk: IChunkViewModel;
}) {
    const [{ id, type, content }] = props.chunk.useChunk();

    return (
        <Box key={"chunk-" + id} style={{ padding: "0.5em" }}>
            {renderView(type, content)}
        </Box>
    );
}

export default ReadonlyChunk;

// Divider sits inbetween chunks, and is a place for a new chunk to spawn or old to drop on.

import AddIcon from "@mui/icons-material/Add";
import { Box, IconButton } from "@mui/material";

import { getFsManagerInstance, makeEndpointURL } from "../Model/mod";

import { Chunk as ChunkType, ChunkContent } from "model";
import { useDrop } from "./dnd";

export function Divider(props: {
    doc: string;
    position: number;
    newChunk: (pos: number) => void;
    insertChunk: (pos: number, chunk: ChunkContent | ChunkType) => void;
    moveChunk: (id: string, pos: number) => void;
    addFromText: (pos: number, content: string) => void;
    add: (pos: number, content: ChunkContent) => void;
}) {
    const { position, newChunk, insertChunk, moveChunk, addFromText, add } =
        props;

    const [{ isOver }, drop] = useDrop<
        { chunk: ChunkType; doc: string; cur: number }
    >(() => ({
        accept: ["chunk", "text/html", "text/plain"],
        acceptFile: true,

        drop: (t, item) => {
            if (t == "chunk") {
                item = item as { chunk: ChunkType; doc: string; cur: number };
                if (item.doc == props.doc) { // in-document move
                    // prevent unnecessary move
                    if (!(item.cur == position - 1 || item.cur == position)) {
                        moveChunk(item.chunk.id, position);
                    }
                } else { // document-by-document move
                    // TODO: need to test this (dnd doc-by-doc).
                    insertChunk(position, item.chunk);
                }
            } else if (t == "text/plain") {
                addFromText(position, item as string);
            } else if (t == "text/html") {
                add(position, { type: "rawhtml", content: item as string });
            }
        },

        filedrop: (t: string, file: File) => {
            const type = t.split("/")[0];

            if (t == "text/html" || type == "text") { // text embedding
                const ctype = (t == "text/html") ? "rawhtml" : "text";
                file.text().then(text =>
                    add(position, { type: ctype, content: text })
                );
            } else if (file.size <= 2048) { // embed file as dataURL
                const reader = new FileReader();
                reader.addEventListener("load", () => {
                    add(position, { // TODO: check if this is correct
                        type: type,
                        content: reader.result,
                    } as ChunkContent);
                });

                reader.readAsDataURL(file);
            } else { // upload file & link URL
                // TODO: where to upload multimedia?
                const path = encodeURI(`media/${Date.now()}-${file.name}`);
                getFsManagerInstance()
                    .then(fs => fs.upload(path, file))
                    .then((res) => {
                        if (res == 200) {
                            const url = makeEndpointURL("/fs/" + path);
                            add(position, {
                                type: type, // TODO: check if this is correct
                                content: url.href,
                            } as ChunkContent);
                        }
                    });
            }
        },
    }), [position]);

    return (
        <Box
            ref={drop}
            sx={{
                display: "flex",
                ...(isOver ? { background: "grey" } : {}), // TODO: change color & move this outside
            }}
        >
            <IconButton
                size="small"
                style={{ margin: "0 auto" }}
                onClick={() => newChunk(position)}
            >
                <AddIcon />
            </IconButton>
        </Box>
    );
}

export default Divider;

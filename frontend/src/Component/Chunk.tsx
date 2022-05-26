import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import {
    Button,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Tooltip,
} from "@mui/material";
import { Chunk as ChunkType } from "model";
import React, {
    ChangeEventHandler,
    createRef,
    useEffect,
    useState,
} from "react";
import { RecoilState, useRecoilState } from "recoil";
import { ChunkViewModel, IChunkViewModel } from "../ViewModel/chunklist";
import { IDocumentViewModel } from "../ViewModel/doc";

import { useDrag } from "./dnd";
import renderView from "./Renderer/mod";

const types = [
    "text",
    "csv",
    "md",
    "rawhtml",
    "image",
    "video",
    "audio",
];

const TypeSelector = (props: {
    update: (t: string) => void;
    value: string;
}) => {
    const update = (event: { target: { value: string } }) => {
        props.update(event.target.value as string);
    };

    return (
        <div>
            <InputLabel id="typeselector-label" shrink={true}>Type</InputLabel>
            <Select
                labelId="typeselector-label"
                id="typeselector"
                value={props.value}
                label="Type"
                onChange={update}
            >
                {types.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
        </div>
    );
};

const Chunk = (props: {
    chunk: IChunkViewModel;
    position: number;
    deleteThis: () => void;
}) => {
    const chunk = props.chunk;
    const [chunkContent, { setType, setContent }] = props.chunk.useChunk();
    const id = chunkContent.id;
    const deleteThis = props.deleteThis;

    const [buffer, setBuffer] = useState(chunkContent.content);

    // Internal States
    const [mode, setMode] = useState<"Read" | "Write">("Read");
    const [onDelete, setOnDelete] = useState(false);

    // drag
    const [, drag] = useDrag(() => ({
        type: "chunk", // TODO: make this constant
        item: {
            chunk: chunkContent,
            doc: props.chunk.parent.docPath,
            cur: props.position,
        },
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

    const onChange: ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement> =
        (e) => setBuffer(e.target.value);

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
                <div
                    id="content"
                    className="content"
                    style={{ height: "100%" }}
                >
                    {renderView(chunkContent.type, chunkContent.content)}
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

    const typeSelector = (
        <TypeSelector update={updateType} value={chunkContent.type} />
    );

    return (
        <Paper
            id={"chunk-" + id}
            key={id}
            ref={(mode == "Read") ? drag : null}
            style={{ padding: "0.5em" }}
            component={"div"}
        >
            <div
                style={{ display: "flex", flexDirection: "row", gap: "0.5em" }}
                onFocus={onFocus}
            >
                {/* content */}
                <div style={{ width: "100%" }} onClick={() => setMode("Write")}>
                    {renderContent()}
                </div>

                {/* sidebar */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.1em",
                    }}
                >
                    {editButton}
                    {deleteButton}
                    {typeSelector}
                </div>
            </div>
        </Paper>
    );
};

export default Chunk;

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Tooltip,
} from "@mui/material";
import React, {
    ChangeEventHandler,
    createRef,
    useEffect,
    useState,
} from "react";

import { ChunkContentKind } from "model";
import { IChunkViewModel } from "../ViewModel/chunklist";
import { useDrag } from "./dnd";
import renderView from "./Renderer/mod";

// TODO: should be in seperate module.
const types = [
    "text",
    "csv",
    "md",
    "rawhtml",
    "katex",
    "image",
    "video",
    "audio",
];

const TypeSelector = (props: {
    update: (t: ChunkContentKind) => void;
    value: string;
}) => {
    const update = (event: { target: { value: string } }) => {
        props.update(event.target.value as ChunkContentKind);
    };

    return (
        <FormControl>
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
        </FormControl>
    );
};

const Preview = (props: {
    type: string;
    content: string;
}) => {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
            }}
        >
            {renderView(props.type, props.content)}
        </Box>
    );
};

const Chunk = (props: {
    chunk: IChunkViewModel;
    position: number;
    deleteThis: () => void;
}) => {
    const chunk = props.chunk;
    const id = chunk.id;
    const deleteThis = props.deleteThis;

    // Hooks
    const [chunkContent, { setType, setContent }] = props.chunk.useChunk();
    const fc = chunk.useFocus();
    const [, drag] = useDrag(() => ({
        type: "chunk",
        item: {
            chunk: chunkContent,
            doc: props.chunk.parent.docPath,
            cur: props.position,
        },
        end: () => {
            return;
        },
    }), [props.position]);

    // Internal States
    const [buffer, setBuffer] = useState(chunkContent.content);
    const [mode, setMode] = useState<"Read" | "Write">("Read");
    const [onDelete, setOnDelete] = useState(false);

    // reference of textfield
    const inputRef = createRef<null | HTMLTextAreaElement>();

    // Effects
    useEffect(() => {
        // set read mode when other chunk gets focused.
        if (!fc) setMode("Read");
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

    const changeMode = () => setMode(mode == "Read" ? "Write" : "Read");

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
                <Box
                    id="content"
                    className="content"
                    style={{ height: "100%" }}
                    onClick={() => setMode("Write")}
                >
                    {renderView(chunkContent.type, chunkContent.content)}
                </Box>
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
        <Tooltip title={mode == "Read" ? "Edit" : "Save"} placement="left">
            <Button onClick={changeMode}>
                {mode == "Read"
                    ? <EditIcon />
                    : <SaveIcon />}
            </Button>
        </Tooltip>
    );

    const deleteButton = (
        <Tooltip title="Delete" placement="left">
            <Button onClick={deleteThis}>
                <DeleteIcon />
            </Button>
        </Tooltip>
    );

    const typeSelector = (
        <TypeSelector update={setType} value={chunkContent.type} />
    );

    return (
        <Paper
            id={"chunk-" + id}
            key={id}
            ref={(mode == "Read") ? drag : null} // use drag only in read mode.
            style={{
                padding: "0.5em",
                display: "flex",
                flexDirection: "row",
                gap: "0.5em",
            }}
            onFocus={onFocus}
            component={"div"}
        >
            <Box // content
                style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                }}
            >
                {renderContent()}
                {(mode == "Write" && chunkContent.type == "katex")
                    && <Preview type={chunkContent.type} content={buffer} />}
            </Box>

            <Box // sidebar
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.1em",
                }}
            >
                {editButton}
                {deleteButton}
                {typeSelector}
            </Box>
        </Paper>
    );
};

export default Chunk;

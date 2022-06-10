import { Box, Button, Chip, Input, Stack } from "@mui/material";
import { FormEventHandler, Fragment, useState } from "react";
import { atom, RecoilState, useRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
import { IDocumentViewModel, useDocViewModel } from "../ViewModel/doc";

import Stash from "../Component/Stash";
import Chunk from "./Chunk";
import Divider from "./Divider";
import ReadonlyChunk from "./ReadonlyChunk";
import Search from "./Search";

function TagBar(props: { readonly: boolean; doc: IDocumentViewModel }) {
    const [tags, setTags] = props.doc.useTags();
    const [taglist, setTaglist] = useState(tags.join(" "));
    const [editable, setEditable] = useState(false);

    const update: FormEventHandler = (e) => {
        e.preventDefault();
        const ntags = taglist.split(" ").filter((s) => s != "");

        setTags(ntags);
        setEditable(false);
    };

    const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) =>
        setTaglist(e.target.value);

    if (editable) {
        return (
            <form onSubmit={update}>
                <Input type="text" onChange={onChange} value={taglist} />
                <Input type="submit" value="Set" />
            </form>
        );
    } else {
        return (
            <Stack direction="row" spacing={1}>
                {tags.map((tag, i) => <Chip key={i} label={tag} />)}
                {!props.readonly
                    && <Button onClick={() => setEditable(true)}>Edit</Button>}
            </Stack>
        );
    }
}

export function ChunkList(
    props: { readonly: boolean; doc: IDocumentViewModel },
) {
    const doc = props.doc;
    const [chunks, mutation] = doc.useChunks();

    const divider = (i: number) => {
        if (!props.readonly) {
            return (
                <Divider
                    key={"divider-" + i}
                    doc={doc.docPath}
                    position={i}
                    newChunk={mutation.create}
                    insertChunk={mutation.add}
                    moveChunk={mutation.move}
                    addFromText={mutation.addFromText}
                    add={mutation.add}
                />
            );
        }
    };

    const chunklist = chunks.map((chunk, i) => {
        const id = chunk.id;
        return (
            <Fragment key={id}>
                {divider(i)}
                {props.readonly
                    ? <ReadonlyChunk chunk={chunk} />
                    : (
                        <Chunk
                            chunk={chunk}
                            position={i}
                            deleteThis={() => mutation.del(id)}
                        />
                    )}
            </Fragment>
        );
    });

    return (
        <Stack spacing={0} className="chunklist">
            {chunklist}
            {divider(chunks.length)}
        </Stack>
    );
}

function InnerDocumentEditor(
    props: { doc: IDocumentViewModel },
) {
    const [writable] = props.doc.useWritable();
    const readonly = !writable;

    return (
        <Box id="document">
            <TagBar readonly={readonly} doc={props.doc} />
            <ChunkList readonly={readonly} doc={props.doc} />
            {!readonly && <Stash />}
        </Box>
    );
}

export type DocumentEditorProps = {
    path: string;
};

export function DocumentEditor(props: DocumentEditorProps) {
    if (props.path == "empty") {
        return <Box>please open a document</Box>; // TODO: proper empty document page
    } else {
        const doc = useDocViewModel(props.path);

        if (doc != null) {
            return <InnerDocumentEditor doc={doc} />;
        } else {
            return <Box>please wait...</Box>;
        }
    }
}

export default DocumentEditor;

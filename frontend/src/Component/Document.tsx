import { Button, Chip, Input, Stack } from "@mui/material";
import { FormEventHandler, Fragment, useState } from "react";
import { atom, RecoilState, useRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
import { IDocumentViewModel, useDocViewModel } from "../ViewModel/doc";

import Chunk from "./Chunk";
import Divider from "./Divider";
import Search from "./Search";

function TagBar(props: { doc: IDocumentViewModel }) {
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
                <Button onClick={() => setEditable(true)}>Edit</Button>
            </Stack>
        );
    }
}

export function ChunkList(props: { doc: IDocumentViewModel }) {
    const doc = props.doc;
    const [chunks, mutation] = doc.useChunks();

    const chunklist = chunks.map((chunk, i) => {
        const id = chunk.id;
        return (
            <Fragment key={id}>
                <Divider
                    doc={doc.docPath}
                    position={i}
                    newChunk={mutation.create}
                    insertChunk={mutation.add}
                    moveChunk={mutation.move}
                    addFromText={mutation.addFromText}
                    add={mutation.add}
                />

                <Chunk
                    chunk={chunk}
                    position={i}
                    deleteThis={() => mutation.del(id)}
                />
            </Fragment>
        );
    });

    return (
        <Stack className="document">
            {chunklist}
            <Divider
                doc={doc.docPath}
                position={chunks.length}
                newChunk={mutation.create}
                insertChunk={mutation.add}
                moveChunk={mutation.move}
                addFromText={mutation.addFromText}
                add={mutation.add}
            />
        </Stack>
    );
}

function InnerDocumentEditor(props: { doc: IDocumentViewModel }) {
    return (
        <>
            <TagBar doc={props.doc} />
            <ChunkList doc={props.doc} />
        </>
    );
}

export function DocumentEditor() {
    const doc = useDocViewModel("test.syd");

    if (doc != null) {
        return <InnerDocumentEditor doc={doc} />;
    } else {
        return <div>please wait...</div>;
    }
}

export default DocumentEditor;

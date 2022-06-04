import { Button, Input } from "@mui/material";
import { useState } from "react";
import Page from "../Page";

export function MediaStory() {
    const [path, setPath] = useState("");
    const [open, setOpen] = useState(false);

    if (open) {
        return (
            <>
                <Button onClick={() => setOpen(false)}>back</Button>
                <Page path={path}></Page>
            </>
        );
    } else {
        return (
            <>
                <Button onClick={() => setOpen(true)}>open</Button>
                <Input
                    value={path}
                    onChange={(e) => setPath(e.currentTarget.value)}
                />
            </>
        );
    }
}

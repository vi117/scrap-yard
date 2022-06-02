import { AppBar, Box, Button, Toolbar } from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { extname } from "path-browserify";
import { useState } from "react";
import { useParams } from "react-router-dom";

import DocumentEditor from "../Component/Document";
import FileTree from "../Component/FileTree";
import Settings from "../Component/Settings";
import ShareButton from "../Component/ShareButton";
import Stash from "../Component/Stash";

const drawerWidth = 240;

export function UI(props: {}) {
    const params = useParams();
    console.log(params);

    const [open, setOpen] = useState(false);
    const [sopen, setSopen] = useState(false);
    const path = params.path + ".syd";
    const [readonly, setReadonly] = useState(false);

    return (
        <div>
            <Toolbar>
                <Button variant="contained" onClick={() => setOpen(!open)}>
                    {open ? "Close" : "Open"}
                </Button>
                <Button variant="contained" onClick={() => setSopen(!open)}>
                    settings
                </Button>
                <Button
                    variant="contained"
                    onClick={() => setReadonly(!readonly)}
                >
                    {readonly ? "readonly" : "writable"}
                </Button>
                <ShareButton doc={path} />
            </Toolbar>

            <Settings open={sopen} onClose={() => setSopen(false)} />
            <FileTree
                width={drawerWidth}
                handleFile={(com: string, f: string) => {
                    console.log(`${com} ${f}`);
                }}
                open={open}
                onClose={() => setOpen(false)}
                root={""}
            />

            <DocumentEditor readonly={readonly} path={path} />
            <Stash />
        </div>
    );
}

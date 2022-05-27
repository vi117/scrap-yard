import { AppBar, Box, Button, Portal, Toolbar } from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { extname } from "path-browserify";
import { useState } from "react";

import DocumentEditor from "../Component/Document";
import FileTree from "../Component/FileTree";
import Settings from "../Component/Settings";
import Stash from "../Component/Stash";

const drawerWidth = 240;

export function UI() {
    const [open, setOpen] = useState(false);
    const [sopen, setSopen] = useState(false);
    const [path, setPath] = useState("test.syd");

    return (
        <Portal>
            <Toolbar>
                <Button variant="contained" onClick={() => setOpen(!open)}>
                    {open ? "Close" : "Open"}
                </Button>
                <Button variant="contained" onClick={() => setSopen(!open)}>
                    settings
                </Button>
            </Toolbar>

            <Settings open={sopen} onClose={() => setSopen(false)} />
            <FileTree
                width={drawerWidth}
                handleOpen={(f: string) => {
                    console.log(f);
                    if (extname(f) == ".syd") {
                        setPath(f);
                    }
                }}
                handleFile={(com: string, f: string) => {
                    console.log(`${com} ${f}`);
                }}
                open={open}
                onClose={() => setOpen(false)}
                root={""}
            />

            <DocumentEditor path={path} />
            <Stash />
        </Portal>
    );
}

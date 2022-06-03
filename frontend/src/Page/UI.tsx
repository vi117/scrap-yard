// main UI of the app.

import { AppBar, Box, Button, Toolbar } from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { extname } from "path-browserify";
import { useState } from "react";
import { useParams } from "react-router-dom";

import DocumentEditor from "../Component/Document";
import ErrorDialog from "../Component/ErrorDialog";
import handleFile from "../Component/FileHandler";
import FileTree from "../Component/FileTree";
import Settings from "../Component/Settings";
import ShareButton from "../Component/ShareButton";

import { logout } from "../Model/login";

const drawerWidth = 240;

function LogoutButton() {
    return (
        <Button
            variant="contained"
            onClick={() => {
                logout();
                window.location.replace("/login");
            }}
        >
            Logout
        </Button>
    );
}

export function UI(props: {}) {
    const params = useParams();

    const [open, setOpen] = useState(false);
    const [sopen, setSopen] = useState(false);
    const [reason, setReason] = useState<null | string>(null);
    const [readonly, setReadonly] = useState(false);
    const eopen = Boolean(reason);
    const path = params.path + ".syd";

    const raise = (e: Error) => {
        setReason(e?.message);
    };

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
                <LogoutButton />
            </Toolbar>

            <Settings open={sopen} onClose={() => setSopen(false)} />
            <FileTree
                width={drawerWidth}
                handleFile={(com: string, f: string) => {
                    console.log(`${com} ${f}`);
                    handleFile(com, { path: f }, raise);
                }}
                open={open}
                onClose={() => setOpen(false)}
                onError={raise}
                root={""}
            />
            <ErrorDialog
                open={eopen}
                onClose={() => setReason(null)}
                reason={reason}
            />

            <DocumentEditor readonly={readonly} path={path} />
        </div>
    );
}

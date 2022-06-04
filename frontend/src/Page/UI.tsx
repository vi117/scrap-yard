// main UI of the app.

import { AppBar, Box, Button, Toolbar } from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { extname } from "path-browserify";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DocumentEditor from "../Component/Document";
import ErrorDialog from "../Component/ErrorDialog";
import handleFile from "../Component/FileHandler";
import FileTree from "../Component/FileTree";
import Settings from "../Component/Settings";
import ShareButton from "../Component/ShareButton";

import { loginType, logout } from "../Model/login";

const drawerWidth = 240;

function LogoutButton() {
    const navigate = useNavigate();
    return (
        <Button
            variant="contained"
            onClick={() => {
                logout();
                navigate("/login");
            }}
        >
            Logout
        </Button>
    );
}

export function UI() {
    const params = useParams();

    const [open, setOpen] = useState(false);
    const [sopen, setSopen] = useState(false);
    const [reason, setReason] = useState<undefined | string>(undefined);
    const eopen = Boolean(reason);
    const path = params.path ? params.path + ".syd" : "empty";

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
                {loginType() == "pass" && <ShareButton doc={path} />}
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
                onClose={() => setReason(undefined)}
                reason={reason}
            />

            <DocumentEditor path={path} />
        </div>
    );
}

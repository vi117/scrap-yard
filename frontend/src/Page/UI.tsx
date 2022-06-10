// main UI of the app.

import { AppBar, Button, Container, Toolbar } from "@mui/material";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ErrorDialog from "../Component/ErrorDialog";
import handleFile from "../Component/FileHandler";
import FileTree from "../Component/FileTree";
import Settings from "../Component/Settings";
import ShareButton from "../Component/ShareButton";

import { loginType, logout } from "../Model/login";
import Page from "./Page";

const drawerWidth = 240;

function LogoutButton() {
    const navigate = useNavigate();
    return (
        <Button
            sx={{ color: "white" }}
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
    const path = params.path ?? "";

    const raise = (e: Error) => {
        setReason(e?.message);
    };

    return (
        <div>
            <AppBar position="static">
                <Container>
                    <Toolbar>
                        <Button
                            sx={{ color: "white" }}
                            onClick={() => setOpen(!open)}
                        >
                            {open ? "Close" : "Open"}
                        </Button>
                        <Button
                            sx={{ color: "white" }}
                            onClick={() => setSopen(!open)}
                        >
                            settings
                        </Button>
                        {loginType() == "pass" && <ShareButton doc={path} />}
                        <LogoutButton />
                    </Toolbar>
                </Container>
            </AppBar>

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

            <Page path={path} />
        </div>
    );
}

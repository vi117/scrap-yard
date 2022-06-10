// main UI of the app.

import {
    Menu as MenuIcon,
    Settings as SettingsIcon,
} from "@mui/icons-material";
import {
    AppBar,
    Box,
    Button,
    Container,
    IconButton,
    Toolbar,
    Typography,
} from "@mui/material";
import { basename } from "path-browserify";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ErrorDialog from "../Component/ErrorDialog";
import handleFile from "../Component/FileHandler";
import FileTree from "../Component/FileTree";
import Settings from "../Component/Settings";
import ShareButton from "../Component/ShareButton";

import { useFileDialog } from "../Component/FileDialog";
import { loginType, logout } from "../Model/login";
import { getOpenedManagerInstance } from "../Model/RPCManager";

import Page from "./Page";

const drawerWidth = 240;

function LogoutButton() {
    const navigate = useNavigate();
    return (
        <Button
            sx={{ color: "white" }}
            onClick={() => {
                (async () => {
                    await logout();
                    const instance = await getOpenedManagerInstance();
                    instance.close();
                })();
                navigate("/login");
            }}
        >
            Logout
        </Button>
    );
}

export function UI() {
    const { pathname } = useLocation();
    const [open, setOpen] = useState(false);
    const [sopen, setSopen] = useState(false);
    const [reason, setReason] = useState<undefined | string>(undefined);
    const eopen = Boolean(reason);

    const [FileDialog, filePrompt] = useFileDialog();

    // it assumes that the pathname is "/app/" + path
    // so, if routing path is changed, the pathname is changed too.
    const path = pathname.substring(5) ?? "";
    const fileBasename = basename(path);

    useEffect(() => {
        document.title = "scrap yard : " + fileBasename;
    }, [fileBasename]);

    const raise = (e: Error) => {
        setReason(e?.message);
    };

    return (
        <Box>
            <AppBar position="static">
                <Container>
                    <Toolbar>
                        <IconButton
                            edge="start"
                            color="inherit"
                            onClick={() => setOpen(!open)}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            {fileBasename}
                        </Typography>
                        <IconButton
                            color="inherit"
                            onClick={() => setSopen(!open)}
                        >
                            <SettingsIcon />
                        </IconButton>
                        <ShareButton doc={path} />
                        <LogoutButton />
                    </Toolbar>
                </Container>
            </AppBar>

            <Settings open={sopen} onClose={() => setSopen(false)} />
            <FileTree
                width={drawerWidth}
                handleFile={(com: string, f: string) => {
                    if (com == "rename") {
                        // use filePrompt to delay renaming until the user types a name.
                        filePrompt((np) =>
                            handleFile(com, { path: f, newpath: np }, raise)
                        );
                    } else {
                        handleFile(com, { path: f }, raise);
                    }
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
            {FileDialog}
        </Box>
    );
}

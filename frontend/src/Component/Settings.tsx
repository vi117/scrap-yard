import CloseIcon from "@mui/icons-material/Close";
import {
    Autocomplete,
    Button,
    Dialog,
    DialogTitle,
    InputLabel,
    List,
    ListItem,
    MenuItem,
    Select,
    TextField,
} from "@mui/material";
import React, { useContext, useState } from "react";
import { ThemeTypeContext } from "../App";

const languages = ["korean", "english"];
const themes = ["light", "dark"];

const rightAlign = { marginLeft: "auto" };

export function Settings(props: {
    open: boolean;
    onClose: () => void;
}) {
    const { themeType, setThemeType } = useContext(ThemeTypeContext);

    // NOTE: language setting is delayed.
    const langSetting = (
        <>
            <InputLabel id="settings-language-select-label">
                Language
            </InputLabel>
            <Select
                labelId="settings-language-select-label"
                value={"korean"}
                // onChange={() => {}} // TODO: fill here
                style={{ ...rightAlign }}
            >
                {languages.map((l) => <MenuItem key={l} value={l}>{l}
                </MenuItem>)}
            </Select>
        </>
    );

    const themeSetting = (
        <>
            <InputLabel id="settings-theme-select-label">Theme</InputLabel>
            <Select
                labelId="settings-theme-select-label"
                value={themeType}
                onChange={(e) => {
                    setThemeType(e.target.value);
                }}
                style={{ ...rightAlign }}
            >
                {themes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
        </>
    );

    return (
        <Dialog
            open={props.open}
            onClose={props.onClose}
            fullWidth={true}
        >
            <DialogTitle>
                Settings
                <Button
                    onClick={props.onClose}
                    style={{ position: "absolute", right: 8, ...rightAlign }}
                >
                    <CloseIcon />
                </Button>
            </DialogTitle>

            <List>
                <ListItem>{langSetting}</ListItem>
                <ListItem>{themeSetting}</ListItem>
            </List>
        </Dialog>
    );
}

export default Settings;

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

// TODO: move these consts to datas
const languages = ["korean", "english"];
const themes = ["light", "dark"];

// TODO: use real context
const context = {
    language: "korean",
    theme: "light",
};

const rightAlign = { marginLeft: "auto" };

export function Settings(props: {
    open: boolean;
    onClose: () => void;
}) {
    const { themeType, setThemeType } = useContext(ThemeTypeContext);

    const langSetting = (
        <>
            <InputLabel id="settings-language-select-label">
                Language
            </InputLabel>
            <Select
                labelId="settings-language-select-label"
                value={context.language}
                onChange={() => {}} // TODO: fill here
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
                }} // TODO: fill here
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

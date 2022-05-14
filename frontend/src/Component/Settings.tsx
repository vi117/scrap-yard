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
import React, { useState } from "react";

// TODO: move these consts to datas
const languages = ["korean", "english"];
const themes = ["light", "dark"];

const context = {
  language: "korean",
  theme: "light",
};

export function Settings(props: {
  open: boolean;
  onClose: () => void;
}) {
  const langSetting = (
    <>
      <InputLabel id="settings-language-select-label">Language</InputLabel>
      <Select
        labelId="settings-language-select-label"
        value={context.language}
        onChange={() => {}} // TODO: fill here
      >
        {languages.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
      </Select>
    </>
  );

  const themeSetting = (
    <>
      <InputLabel id="settings-theme-select-label">Theme</InputLabel>
      <Select
        labelId="settings-theme-select-label"
        value={context.theme}
        onChange={() => {}} // TODO: fill here
      >
        {themes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
      </Select>
    </>
  );

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
    >
      <DialogTitle>
        Settings
        <Button onClick={props.onClose}>X</Button>
      </DialogTitle>

      <List>
        <ListItem>{langSetting}</ListItem>
        <ListItem>{themeSetting}</ListItem>
      </List>
    </Dialog>
  );
}

export default Settings;

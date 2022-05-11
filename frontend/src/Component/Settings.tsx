import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  TextField,
} from "@mui/material";
import React, { useState } from "react";

export function Settings(props: {
  open: boolean;
  onClose: () => void;
}) {
  const langSetting = (
    <Autocomplete
      options={["ko", "en"]}
      renderInput={(p) => <TextField {...p} label="Language" />}
    />
  );

  const themeSetting = (
    <Autocomplete
      options={["light", "dark"]}
      renderInput={(p) => <TextField {...p} label="Theme" />}
    />
  );

  return (
    <Dialog
      fullScreen
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

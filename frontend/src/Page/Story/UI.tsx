import { Appbar, Box, Button } from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { useState } from "react";

import "../../App.css";
import DocumentEditor from "../../Component/Document";
import FileList from "../../Component/FileList";
import Settings from "../../Component/Settings";

const drawerWidth = 240;

export function UI() {
  const [open, setOpen] = useState(false);
  const [sopen, setSopen] = useState(false);

  return (
    <Box>
      <Button variant="contained" onClick={() => setOpen(!open)}>
        {open ? "Close" : "Open"}
      </Button>
      <Button variant="contained" onClick={() => setSopen(!open)}>
        settings
      </Button>
      <Settings open={sopen} onClose={() => setSopen(false)} />

      <FileList
        width={drawerWidth}
        open={open}
        onClick={(f) => console.log(f)}
        onClose={() => setOpen(false)}
      />

      <DocumentEditor />
    </Box>
  );
}

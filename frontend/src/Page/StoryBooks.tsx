import { Box, Tab, Tabs } from "@mui/material";
import { useState } from "react";
import { DocumentEditor } from "../Component/Document";
import { WebsocketIO } from "./Story/WebsocketIO";

const StorybookList = [
  {
    name: "document",
    elem: <DocumentEditor></DocumentEditor>,
  },
  {
    name: "websocket io",
    elem: <WebsocketIO></WebsocketIO>,
  },
];

export function Storybooks() {
  const [selected, setSelected] = useState(0);
  return (
    <div>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={selected}
          onChange={(e, v) => setSelected(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {StorybookList.map((storybook, index) => <Tab key={index} label={storybook.name} />)}
        </Tabs>
      </Box>
      {StorybookList[selected].elem}
    </div>
  );
}
export default Storybooks;

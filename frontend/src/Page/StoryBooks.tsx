import { Box, Tab, Tabs } from "@mui/material";
import { useState } from "react";
import { TestStorybook } from "./Story/Test";
import { WebsocketIO } from "./Story/WebsocketIO";

const StorybookList = [
  {
    name: "websocket io",
    elem: <WebsocketIO></WebsocketIO>,
  },
  {
    name: "test",
    elem: <TestStorybook></TestStorybook>,
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

import { Typography } from "@mui/material";
import { MockDocument } from "model";
import { Route, Routes } from "react-router-dom";
import { DocumentEditor } from "../Component/Document";

const StorybookList = [
  {
    name: "document",
    elem: <DocumentEditor></DocumentEditor>,
  },
];

export function Storybooks() {
  return (
    <div>
      <Routes>
        {StorybookList.map((story, i) => <Route key={i} path={`${story.name}`} element={story.elem}></Route>)}
        <Route path="*" element={<Typography>Nothing Selected</Typography>}></Route>
      </Routes>
    </div>
  );
}
export default Storybooks;

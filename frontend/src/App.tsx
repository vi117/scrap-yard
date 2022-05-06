import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RecoilRoot } from "recoil";
import "./App.css";
import DocumentEditor from "./Component/Document";
import { NotFound } from "./Page/NotFoundPage";
import { Storybooks } from "./Page/StoryBooks";

function App() {
  return (
    <RecoilRoot>
      <DndProvider backend={HTML5Backend}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to={"app/"} />}>
            </Route>
            <Route path="app/*" element={<DocumentEditor></DocumentEditor>}>
            </Route>
            <Route path="storybook/*" element={<Storybooks></Storybooks>}></Route>
            <Route path="*" element={<NotFound />}>
            </Route>
          </Routes>
        </BrowserRouter>
      </DndProvider>
    </RecoilRoot>
  );
}

export default App;

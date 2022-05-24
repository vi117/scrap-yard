import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RecoilRoot } from "recoil";
import "./App.css";
import { NotFound } from "./Page/NotFoundPage";
import { UI } from "./Page/Story/UI";
import { Storybooks } from "./Page/StoryBooks";

function App() {
    return (
        <RecoilRoot>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to={"app/"} />}>
                    </Route>
                    <Route path="app/*" element={<UI></UI>}>
                    </Route>
                    <Route
                        path="storybook/*"
                        element={<Storybooks></Storybooks>}
                    >
                    </Route>
                    <Route path="*" element={<NotFound />}>
                    </Route>
                </Routes>
            </BrowserRouter>
        </RecoilRoot>
    );
}

export default App;

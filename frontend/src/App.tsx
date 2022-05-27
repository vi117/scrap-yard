import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RecoilRoot } from "recoil";
import "./App.css";
import { NotFound } from "./Page/NotFoundPage";
import { Storybooks } from "./Page/StoryBooks";
import { UI } from "./Page/UI";

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

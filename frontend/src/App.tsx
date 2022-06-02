import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RecoilRoot } from "recoil";
import "./App.css";
import Login from "./Page/Login";
import { NotFound } from "./Page/NotFoundPage";
import { Storybooks } from "./Page/StoryBooks";
import { UI } from "./Page/UI";

function App() {
    return (
        <RecoilRoot>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to={"/app/test"} />}>
                    </Route>
                    <Route path="app/:path" element={<UI />}>
                    </Route>
                    <Route path="login" element={<Login />} />
                    <Route
                        path="storybook/*"
                        element={<Storybooks></Storybooks>}
                    >
                    </Route>
                    <Route path="" element={<NotFound />}>
                    </Route>
                </Routes>
            </BrowserRouter>
        </RecoilRoot>
    );
}

export default App;

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RecoilRoot } from "recoil";
import "./App.css";
import Login from "./Page/Login";
import { NotFound } from "./Page/NotFoundPage";
import { Storybooks } from "./Page/StoryBooks";
import TokenLogin from "./Page/TokenLogin";
import { UI } from "./Page/UI";

function App() {
    return (
        <RecoilRoot>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to={"/login"} />} />
                    <Route path="app" element={<UI />} />
                    <Route path="app/:path" element={<UI />} />
                    <Route path="token/:token" element={<TokenLogin />} />
                    <Route path="login" element={<Login />} />
                    <Route
                        path="storybook/*"
                        element={<Storybooks></Storybooks>}
                    />
                    <Route path="" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </RecoilRoot>
    );
}

export default App;

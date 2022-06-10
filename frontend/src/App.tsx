import { Button, Typography } from "@mui/material";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RecoilRoot } from "recoil";

import "./App.css";
import { Loading } from "./Component/Loading";
import { getLoginInfo } from "./Model/login";
import { getServerInfoInstance } from "./Model/mod";
import Login from "./Page/Login";
import { NotFound } from "./Page/NotFoundPage";
import { Storybooks } from "./Page/StoryBooks";
import TokenLogin from "./Page/TokenLogin";
import { UI } from "./Page/UI";
import { useAsync } from "./util/util";

import "./util/util.css";

function AppContainer() {
    return (
        <RecoilRoot>
            <App></App>
        </RecoilRoot>
    );
}

function App() {
    const [accessible, reload] = useAsync(
        async () => {
            const serverInfo = await getServerInfoInstance();
            const loginInfo = await getLoginInfo();
            // return switch of login
            return serverInfo.allowAnonymous || loginInfo.login;
        },
        undefined,
        [],
    );
    if (accessible.loading) {
        return (
            <div className="center_container">
                <Loading></Loading>
            </div>
        );
    }
    if (accessible.error) {
        return (
            <div className="center_container">
                <Typography variant="h5">
                    Loading Failed. Please check your network.
                </Typography>
                <Button onClick={reload}>reload</Button>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Navigate to={accessible ? "/app" : "/login"} />}
                />
                <Route path="app" element={<UI />} />
                <Route path="app/*" element={<UI />} />
                <Route path="token/:token" element={<TokenLogin />} />
                <Route path="login" element={<Login />} />
                <Route
                    path="storybook/*"
                    element={<Storybooks></Storybooks>}
                />
                <Route path="" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppContainer;

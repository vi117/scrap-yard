import {
    Box,
    Button,
    ThemeProvider,
    Typography,
    useTheme,
} from "@mui/material";
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";
import { RecoilRoot } from "recoil";

import { createTheme } from "@mui/material";
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

const theme = createTheme({
    palette: {
        mode: "dark",
    },
});

function AppContainer() {
    return (
        <RecoilRoot>
            <ThemeProvider theme={theme}>
                <Box bgcolor="background.default" className="FullScreen">
                    <App></App>
                </Box>
            </ThemeProvider>
        </RecoilRoot>
    );
}

function NavUI(props: { access: boolean }) {
    const { pathname } = useLocation();
    if (props.access) {
        return <UI></UI>;
    } else {
        const path = pathname.substring(5) ?? "";
        const param = new URLSearchParams();
        param.set("returnTo", path);
        return <Navigate to={`/login?${param.toString()}`}></Navigate>;
    }
}

function App() {
    const [accessible, reload] = useAsync(
        async () => {
            const serverInfo = await getServerInfoInstance();
            const loginInfo = await getLoginInfo();
            if (sessionStorage.getItem("logintype") === null) {
                sessionStorage.setItem("logintype", "token");
            }
            // return switch of login
            return serverInfo.allowAnonymous || loginInfo.login;
        },
        undefined,
        [],
    );
    if (accessible.loading) {
        return (
            <Box className="center_container">
                <Loading></Loading>
            </Box>
        );
    }
    if (accessible.error) {
        return (
            <Box className="center_container">
                <Typography color="text.primary" variant="h5">
                    Loading Failed. Please check your network.
                </Typography>
                <Button onClick={reload}>reload</Button>
            </Box>
        );
    }

    const access = accessible.data as boolean;

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Navigate to={access ? "/app" : "/login"} />}
                />
                <Route path="app" element={<NavUI access={access} />} />
                <Route path="app/*" element={<NavUI access={access} />} />
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

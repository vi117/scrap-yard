// login page for admin.

import { Box, Button, Input, Typography } from "@mui/material";
import { join } from "path-browserify";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { loginWithPassword } from "../Model/login";

export function Login() {
    const navigate = useNavigate();
    const [searchParams, _] = useSearchParams();
    const [errorMsg, setErrorMsg] = useState<string | undefined>();
    const [password, setPassword] = useState<string>("");

    const login = async () => {
        try {
            await loginWithPassword(password);
            let path = "/app";
            const returnTo = searchParams.get("returnTo");
            if (returnTo) {
                path = join(path, returnTo);
            }
            navigate(path);
        } catch (e) {
            if (e instanceof Error) {
                setErrorMsg(e.message);
            } else {
                console.error(e);
                setErrorMsg(JSON.stringify(e));
            }
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key == "Enter") login();
    };

    return (
        <Box
            sx={{
                maxWidth: "600px",
                margin: "2em auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            <Typography color="text.primary" variant="h3">
                Welcome to Scrapyard!
            </Typography>

            <Box>
                <Input
                    type="password"
                    onChange={(e) => {
                        setPassword(e.currentTarget.value);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="password"
                />
                <Button type="button" onClick={login}>Login</Button>
            </Box>

            <Box
                style={{ color: "red" }}
                id="error"
            >
                {errorMsg}
            </Box>
        </Box>
    );
}

export default Login;

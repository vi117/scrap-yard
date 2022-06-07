// login page for admin.

import { Button, Input, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginWithPassword } from "../Model/login";

export function Login() {
    const navigate = useNavigate();
    const [errorMsg, setErrorMsg] = useState<string | undefined>();
    const [password, setPassword] = useState<string>("");

    const login = () => {
        loginWithPassword(password)
            .then(() => navigate("/app"))
            .catch(e => setErrorMsg(e.message));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key == "Enter") login();
    };

    return (
        <main
            style={{
                maxWidth: "600px",
                margin: "2em auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            <Typography variant="h3">Welcome to Scrapyard!</Typography>

            <div>
                <Input
                    type="password"
                    onChange={(e) => {
                        setPassword(e.currentTarget.value);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="password"
                />
                <Button type="button" onClick={login}>Login</Button>
            </div>

            <div
                style={{ color: "red" }}
                id="error"
            >
                {errorMsg}
            </div>
        </main>
    );
}

export default Login;

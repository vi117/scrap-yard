// login page for admin.

import { Input, Typography, Button } from "@mui/material";
import { useEffect, useRef, useState } from "react";
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
                <Input type="password" onChange={(e) => { setPassword(e.currentTarget.value) }} placeholder="password" />
                <Button type="button" onClick={login}>Login</Button>
            </div>

            <div
                style={{ color: "red" }}
                id="error"
            >{errorMsg}</div>
        </main>
    );
}

export default Login;

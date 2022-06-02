// login page for admin.

import { Input } from "@mui/material";
import { useRef } from "react";

import { loginWithPassword } from "../Model/login";

export function Login() {
    const inputRef = useRef();
    const errorRef = useRef();

    const login = () => {
        if (inputRef.current != null) {
            loginWithPassword(inputRef.current.value)
                .then(() => window.location.replace("/app/test"))
                .catch(e => errorRef.current.innerText = e.message);
        }
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
            <h1>welcome to Scrapyard!</h1>
            <div>
                <Input type="password" inputRef={inputRef} />
                <Input type="button" onClick={login} value="Login" />
            </div>
            <div
                style={{ color: "red" }}
                id="error"
                ref={errorRef}
            />
        </main>
    );
}

export default Login;

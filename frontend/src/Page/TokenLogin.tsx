// login by token

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { loginWithToken } from "../Model/login";

export function TokenLogin() {
    const params = useParams();
    const navigate = useNavigate();
    const [msg, setMsg] = useState("please wait");

    loginWithToken(params.token ?? "")
        .then(() => navigate("/app"))
        .catch(e => setMsg(e.message));

    return <div>{msg}</div>;
}

export default TokenLogin;

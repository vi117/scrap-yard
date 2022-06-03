// login by token

import { Navigate, useParams } from "react-router-dom";

import { loginWithToken } from "../Model/login";

export function TokenLogin() {
    const params = useParams();
    loginWithToken(params.token ?? "");

    return <Navigate to={"/app"} />;
}

export default TokenLogin;

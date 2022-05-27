import { Button } from "@mui/material";
import { useEffect, useState } from "react";

import { getOpenedManagerInstance } from "../Model/RPCManager";
import { shareDoc, shareGetInfo } from "../Model/share";

export function ShareButton(props: {
    doc: string;
}) {
    const [token, setToken] = useState<string | null>(null);
    const [text, setText] = useState("Share");

    useEffect(() => {
        setToken(null);
        setText("Share");
    }, [props.doc]);

    useEffect(() => {
        if (token != null) {
            setText("Token: " + token);
        }
    }, [token]);

    const share = async () => {
        const man = await getOpenedManagerInstance();
        const res = await shareDoc(man, { docPath: props.doc });
        setToken(res.token);
    };

    const copy = () => {
        navigator.clipboard.writeText(token ?? "")
            .then(() => setText("Copied"));
    };

    return (
        <Button variant="contained" onClick={(token == null) ? share : copy}>
            {text}
        </Button>
    );
}

export default ShareButton;

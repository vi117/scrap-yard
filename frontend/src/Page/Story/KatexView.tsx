import { Button, Paper, TextField } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { KatexRenderer } from "../../Component/Renderer/KatexRenderer";

export function TestStorybook() {
    const [tex, setTex] = useState("a^2 + b^2 = c^2");
    return (
        <Paper>
            <TextField onChange={(e) => setTex(e.target?.value)} value={tex}>
            </TextField>
            <KatexRenderer tex={tex}></KatexRenderer>
        </Paper>
    );
}

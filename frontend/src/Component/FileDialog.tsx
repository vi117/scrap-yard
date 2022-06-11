import { Button, Dialog, DialogContent, Input } from "@mui/material";
import { useEffect, useState } from "react";

export function useFileDialog(): [
    JSX.Element,
    (cb: (text: string) => void) => void,
] {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);
    const [text, setText] = useState("");
    const [callb, setCallb] = useState<null | ((text: string) => void)>(null);

    const handleClick = () => {
        if (text != "") {
            callb(text);
            setText("");
        }
        setCallb(null);
        close();
    };

    const filePrompt = (cb: (f: string) => void) => {
        setCallb(() => cb); // DO NOT REMOVE CLOSURE; extra closure ensures cb is begin called
        setOpen(true);
    };

    // I want make this as a React component, but that makes it flicker when a character is
    // typed...(basically the refresh of this hook).
    const component = (
        <Dialog open={open} onClose={close}>
            <DialogContent>
                <Input
                    autoFocus
                    type="text"
                    onChange={(e) => setText(e.target.value)}
                    value={text}
                />
                <Button onClick={handleClick}>Ok</Button>
            </DialogContent>
        </Dialog>
    );

    return [component, filePrompt];
}

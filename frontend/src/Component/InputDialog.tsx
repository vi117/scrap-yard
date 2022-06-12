import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    Input,
} from "@mui/material";
import { useState } from "react";

type CallbackFunction = (t: string) => void;

export function useInputDialog(
    description: string,
    placeholder?: string,
): [JSX.Element, (cb: CallbackFunction) => void] {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);
    const [text, setText] = useState("");
    const [callb, setCallb] = useState<CallbackFunction | null>(null);

    const handleClick = () => {
        if (text != "" && callb != null) {
            callb(text);
            setText("");
        }
        setCallb(null);
        close();
    };

    const inputPrompt = (cb: CallbackFunction) => {
        setCallb(() => cb); // DO NOT REMOVE CLOSURE; extra closure stops cb from being called
        setOpen(true);
    };

    // I want to make this as a React component, but that makes it flicker when a character is
    // typed...(basically the refresh of this hook).
    const inputDialog = (
        <Dialog open={open} onClose={close}>
            <DialogContent>
                <DialogTitle>{description}</DialogTitle>
                <Input
                    autoFocus
                    placeholder={placeholder ?? ""}
                    type="text"
                    onChange={(e) => setText(e.target.value)}
                    value={text}
                />
                <Button onClick={handleClick}>Ok</Button>
                <Button onClick={close}>Cancel</Button>
            </DialogContent>
        </Dialog>
    );

    return [inputDialog, inputPrompt];
}

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
} from "@mui/material";

export function ErrorDialog(props: {
    open: boolean;
    onClose: () => void;
    reason?: string;
}) {
    const { open, onClose, reason } = props;

    return (
        <Dialog
            open={open}
            onClose={onClose}
        >
            <DialogContent>
                <DialogContentText>
                    {reason}
                </DialogContentText>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

export default ErrorDialog;

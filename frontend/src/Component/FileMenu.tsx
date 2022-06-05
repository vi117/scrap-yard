import {
    ClickAwayListener,
    Grow,
    MenuItem,
    MenuList,
    Paper,
    Popper,
} from "@mui/material";

type FileOp = {
    name: string;
    com: string;
};

const fileOps = [
    { name: "Rename", com: "rename" },
    { name: "Move", com: "move" },
    { name: "Delete", com: "delete" },
    { name: "Info", com: "info" },
];

export function FileMenu(props: {
    anchorEl: HTMLElement;
    open: boolean;
    handleClose: () => void;
    handleFile: (command: string) => void;
}) {
    const { anchorEl, open, handleClose } = props;

    const handleFile = (com: string) =>
        () => {
            props.handleFile(com);
            handleClose();
        };

    const fileMenuItem = (op: FileOp) => (
        <MenuItem key={op.com} onClick={handleFile(op.com)}>
            {op.name}
        </MenuItem>
    );

    return (
        <Popper
            id="filemenu"
            anchorEl={anchorEl}
            open={open}
            placement="bottom-start"
            transition
            disablePortal
            sx={{ zIndex: 1000 }} // use sufficiently big number
        >
            {({ TransitionProps, placement }) => (
                <Grow
                    {...TransitionProps}
                    style={{
                        transformOrigin: placement === "bottom-start"
                            ? "left top"
                            : "left bottom",
                    }}
                >
                    <Paper>
                        <ClickAwayListener onClickAway={handleClose}>
                            <MenuList
                                autoFocusItem={open}
                                id="filemenu-list"
                            >
                                {fileOps.map(fileMenuItem)}
                            </MenuList>
                        </ClickAwayListener>
                    </Paper>
                </Grow>
            )}
        </Popper>
    );
}

export default FileMenu;

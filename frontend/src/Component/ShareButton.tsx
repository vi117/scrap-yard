import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Paper,
    Popover,
    Select,
    SelectChangeEvent,
} from "@mui/material";
import React, { MouseEvent, useState } from "react";

import { getOpenedManagerInstance } from "../Model/RPCManager";
import { makeEndpointURL } from "../Model/serverInfo";
import { shareDoc, shareGetInfo } from "../Model/share";

const defaultOption = {
    writable: false,
    expires_after: 7, // days
};

type ShareOption = typeof defaultOption;

function d(name: string, day: number) {
    return { name, day };
}

const dayOptions = [
    d("1 Week", 7),
    d("2 Weeks", 14),
    d("1 Month", 30),
    d("1 year", 365),
];

function ShareOption(props: {
    open: boolean;
    onClose: () => void;
    anchorEl: HTMLButtonElement | null;
    onConfirm: (option: ShareOption) => void;
}) {
    const { open, onClose, anchorEl } = props;
    const [option, setOption] = useState(defaultOption);

    const updateWritable = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOption({ ...option, writable: e.target.checked });
    };

    const updateDay = (e: SelectChangeEvent) => {
        setOption({ ...option, expires_after: parseInt(e.target.value) });
    };

    return (
        <Popover
            open={open}
            onClose={onClose}
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
            }}
            transformOrigin={{
                vertical: "top",
                horizontal: "right",
            }}
        >
            <Paper
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "0.6em",
                }}
            >
                <FormControlLabel
                    label="Writable"
                    control={
                        <Checkbox
                            checked={option.writable}
                            onChange={updateWritable}
                        />
                    }
                />

                <FormControl>
                    <InputLabel id="option-expires-after">
                        Expires after
                    </InputLabel>
                    <Select
                        labelId="option-expires-after"
                        label="Expires After"
                        value={option.expires_after.toString()}
                        onChange={updateDay}
                    >
                        {dayOptions.map((d) => (
                            <MenuItem key={d.day} value={d.day}>
                                {d.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Button onClick={() => props.onConfirm(option)}>
                    Copy URL
                </Button>
            </Paper>
        </Popover>
    );
}

export function ShareButton(props: {
    doc: string;
    onError: (e: Error) => void;
}) {
    const [token, setToken] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const open = Boolean(anchorEl);

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const copy = (token: string) => {
        const url = window.location.origin + "/token/" + token;
        navigator.clipboard.writeText(url.href);
    };

    const handleConfirm = (option: ShareOption) => {
        const expired = new Date();
        expired.setDate(expired.getDate() + option.expires_after);

        if (token) {
            copy(token);
        } else {
            getOpenedManagerInstance()
                .then(man =>
                    shareDoc(man, {
                        docPath: props.doc,
                        write: option.writable,
                        expired: expired.getTime(),
                    })
                )
                .then(res => {
                    setToken(res.token);
                    copy(res.token);
                })
                .catch(props.onError);
        }
    };

    return (
        <>
            <Button sx={{ color: "white" }} onClick={handleClick}>
                Share
                <KeyboardArrowDownIcon />
            </Button>
            <ShareOption
                open={open}
                onClose={handleClose}
                anchorEl={anchorEl}
                onConfirm={handleConfirm}
            />
        </>
    );
}

export default ShareButton;

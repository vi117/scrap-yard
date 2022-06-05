import { Button, ButtonProps, CircularProgress } from "@mui/material";
import React, { useState } from "react";

export type AsyncLoadingButtonProps =
    & Omit<ButtonProps, "onClick" | "disabled">
    & { onClick: () => Promise<void> };

export function AsyncLoadingButton(props: AsyncLoadingButtonProps) {
    const [loading, setLoading] = useState<boolean>(false);
    const { onClick, children, ...rest } = props;
    return (
        <Button
            disabled={loading}
            {...rest}
            onClick={() => {
                setLoading(true);
                onClick().then(() => {
                    setLoading(false);
                }).catch((e) => {
                    setLoading(false);
                });
            }}
        >
            <React.Fragment>
                {loading && <CircularProgress color="inherit" size={16} />}
                {children}
            </React.Fragment>
        </Button>
    );
}

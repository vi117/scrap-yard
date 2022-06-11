import { Link as MuiLink, LinkProps as MuiLinkProps } from "@mui/material";
import {
    Link as RouterLink,
    LinkProps as RouterLinkProps,
} from "react-router-dom";

export type LinkProps = MuiLinkProps & RouterLinkProps;

export function Link(props: LinkProps) {
    return <MuiLink {...props} component={RouterLink} />;
}

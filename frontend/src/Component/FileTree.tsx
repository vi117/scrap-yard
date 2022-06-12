import ArticleIcon from "@mui/icons-material/Article";
import FolderIcon from "@mui/icons-material/Folder";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import TreeItem, {
    TreeItemContentProps,
    TreeItemProps,
    useTreeItem,
} from "@mui/lab/TreeItem";
import TreeView from "@mui/lab/TreeView";
import { Box, Button, Drawer, IconButton, Typography } from "@mui/material";
import clsx from "clsx";
import { join as pathJoin } from "path-browserify";
import React, { forwardRef, useCallback, useRef, useState } from "react";
import { Link } from "./Link";

import { getFsManagerInstance } from "../Model/FsManager";
import { DirTree, useDirTree } from "./dirTree";
import { useDrop } from "./dnd";
import FileMenu from "./FileMenu";
import { useInputDialog } from "./InputDialog";

interface DirHandleProp {
    handleFile: (command: string) => void;
    path: string;
    drop: (elem: HTMLElement) => void;
    isOver: boolean;
}

const DirContent = forwardRef<
    HTMLDivElement,
    TreeItemContentProps & DirHandleProp
>(function DirContent(
    props: TreeItemContentProps & DirHandleProp,
    ref,
) {
    const {
        classes,
        className,
        label,
        nodeId,
        icon,
        handleFile,
        path,
        drop,
        isOver,
    } = props;
    const {
        disabled,
        expanded,
        selected,
        focused,
        handleExpansion,
        handleSelection,
        preventSelection,
    } = useTreeItem(nodeId);

    const anchorRef = useRef<HTMLButtonElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => {
        setMenuOpen(true);
        e.stopPropagation();
    };
    const handleMenuClose = () => {
        setMenuOpen(false);
    };

    const handleMouseDown = (event: React.SyntheticEvent<Element, Event>) => {
        preventSelection(event);
    };

    const handleClick = (event: React.SyntheticEvent<Element, Event>) => {
        handleExpansion(event);
        handleSelection(event);
    };

    const rootRef = useCallback<(elem: HTMLDivElement) => void>((elem) => {
        if (ref instanceof Function) {
            ref(elem);
        } else if (ref !== null && ref !== undefined) {
            ref.current = elem;
        }
        if (drop) drop(elem);
    }, [ref]);

    return (
        <Box
            className={clsx(className, classes.root, {
                [classes.expanded]: expanded,
                [classes.selected]: selected,
                [classes.focused]: focused,
                [classes.disabled]: disabled,
            })}
            ref={rootRef}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            style={{
                display: "flex",
                background: isOver ? "gray" : undefined,
            }}
        >
            <Box className={classes.iconContainer}>
                {icon}
            </Box>

            <Typography
                component="div"
                color="text.primary"
                className={classes.label}
                noWrap={true}
            >
                <Link
                    color="inherit"
                    style={{
                        textDecoration: "none",
                        display: "block",
                    }}
                    key={path}
                    to={pathJoin("/app", path)}
                >
                    {label}
                </Link>
            </Typography>

            <IconButton
                ref={anchorRef}
                onClick={handleMenuClick}
                sx={{ marginLeft: "auto" }}
            >
                <MoreVertIcon fontSize="small" />
            </IconButton>

            <FileMenu
                anchorEl={anchorRef.current}
                open={menuOpen}
                handleClose={handleMenuClose}
                handleFile={handleFile}
            />
        </Box>
    );
});

const DirItem = (props: TreeItemProps & { handle: DirHandleProp }) => (
    <TreeItem
        //
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ContentComponent={DirContent}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ContentProps={props.handle}
        {...props}
    />
);

function NewFileButton(props: {
    handleFile: (command: string, newfile: string) => void;
}) {
    const [inputDialog, inputPrompt] = useInputDialog(
        "enter file name",
        "filename.syd",
    );

    const newfile = (nf: string) => {
        props.handleFile("create", nf);
    };

    return (
        <>
            <Button onClick={() => inputPrompt(newfile)}>Add document</Button>
            {inputDialog}
        </>
    );
}

type FileTreeProp = {
    dirTree: DirTree;
    width: number;
    open: boolean;
    handleFile: (com: string, file: string) => void;
    onClose: () => void;
    onError: (e: Error) => void;
    root: string;
};

export function FileTreeInner(props: FileTreeProp) {
    const dirTree = props.dirTree;

    const renderTree = (node: DirTree) => {
        const [{ isOver }, drop] = (node.type == "dir")
            ? useDrop(() => ({
                accept: [],
                acceptFile: true,

                drop: () => {
                    return;
                },
                filedrop: (t, file) => {
                    const path = encodeURI(`${node.path}/${file.name}`);
                    getFsManagerInstance().then(fs => fs.upload(path, file));
                },
            }), [node])
            : [{ isOver: false }, () => {
                return;
            }];

        return (
            <DirItem
                key={node.name}
                nodeId={node.name}
                label={node.name}
                icon={node.type == "dir" ? <FolderIcon /> : <ArticleIcon />}
                handle={{
                    drop: drop,
                    isOver: isOver,
                    path: node.path,
                    handleFile: (com) => {
                        props.handleFile(com, node.path);
                    },
                }}
            >
                {Array.isArray(node.children)
                    ? node.children.map(renderTree)
                    : null}
            </DirItem>
        );
    };

    return (
        <Drawer
            open={props.open}
            onClose={props.onClose}
        >
            <NewFileButton handleFile={props.handleFile} />
            <TreeView
                sx={{
                    width: props.width,
                    overflow: "hidden",
                }}
                defaultExpanded={["."]}
            >
                {renderTree(dirTree)}
            </TreeView>
        </Drawer>
    );
}

export function FileTree(props: Omit<FileTreeProp, "dirTree">) {
    const dirTree = useDirTree(props.root);

    if (dirTree != null) {
        return <FileTreeInner {...props} dirTree={dirTree} />;
    } else {
        return <Box>wait</Box>;
    }
}

export default FileTree;

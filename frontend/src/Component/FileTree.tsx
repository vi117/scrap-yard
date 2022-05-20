import ArticleIcon from "@mui/icons-material/Article";
import FolderIcon from "@mui/icons-material/Folder";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import TreeItem, { TreeItemContentProps, TreeItemProps, useTreeItem } from "@mui/lab/TreeItem";
import TreeView from "@mui/lab/TreeView";
import {
  Button,
  ClickAwayListener,
  Drawer,
  Grow,
  IconButton,
  Menu,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Typography,
} from "@mui/material";
import clsx from "clsx";
import React, { forwardRef, useEffect, useRef, useState } from "react";

import { DirTree, useDirTree } from "./dirTree";

interface DirHandleProp {
  handleOpen: () => void;
  handleFile: (command: string) => void;
}

function FileMenu(props: {
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
            transformOrigin: placement === "botton-start" ? "left top" : "left bottom",
          }}
        >
          <Paper>
            <ClickAwayListener onClickAway={handleClose}>
              <MenuList
                autoFocusItem={open}
                id="filemenu-list"
              >
                <MenuItem onClick={handleFile("rename")}>Rename</MenuItem>
                <MenuItem onClick={handleFile("move")}>Move</MenuItem>
                <MenuItem onClick={handleFile("delete")}>Delete</MenuItem>
              </MenuList>
            </ClickAwayListener>
          </Paper>
        </Grow>
      )}
    </Popper>
  );
}

const DirContent = forwardRef(function DirContent(
  props: TreeItemContentProps & DirHandleProp,
  ref,
) {
  const {
    classes,
    className,
    label,
    nodeId,
    icon,
    handleOpen,
    handleFile,
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

  const anchorRef = useRef<HTMLElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setMenuOpen(true);
  };
  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  const handleMouseDown = (event) => {
    preventSelection(event);
  };

  const handleClick = (event) => {
    handleExpansion(event);
    handleSelection(event);
    handleOpen();
  };

  return (
    <div
      className={clsx(className, classes.root, {
        [classes.expanded]: expanded,
        [classes.selected]: selected,
        [classes.focused]: focused,
        [classes.disabled]: disabled,
      })}
      ref={ref as React.Ref<HTMLDivElement>}
      onMouseDown={handleMouseDown}
      style={{
        display: "flex",
      }}
    >
      <div className={classes.iconContainer}>
        {icon}
      </div>

      <Typography
        component="div"
        className={classes.label}
        onClick={handleClick}
      >
        {label}
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
    </div>
  );
});

const DirItem = (props: TreeItemProps & { handle: DirHandleProp }) => (
  <TreeItem
    ContentComponent={DirContent}
    ContentProps={props.handle}
    {...props}
  />
);

export function FileTreeInner(props: {
  dirTree: DirTree;
  width: number;
  open: boolean;
  handleOpen: (f: string) => void;
  handleFile: (com: string, file: string) => void;
  onClose: () => void;
  root: string;
}) {
  const dirTree = props.dirTree;

  const renderTree = (node: DirTree) => {
    return (
      <DirItem
        key={node.name}
        nodeId={node.name}
        label={node.name}
        icon={node.type == "dir" ? <FolderIcon /> : <ArticleIcon />}
        handle={{
          handleOpen: () => props.handleOpen(node.path),
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
      <TreeView
        sx={{ width: props.width }}
        defaultExpanded={["/"]}
      >
        {renderTree(dirTree)}
      </TreeView>
    </Drawer>
  );
}

export function FileTree(props) {
  const dirTree = useDirTree(props.root);

  if (dirTree != null) {
    return <FileTreeInner {...props} dirTree={dirTree} />;
  } else {
    return <div>wait</div>;
  }
}

export default FileTree;

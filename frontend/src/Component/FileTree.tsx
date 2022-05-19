import ArticleIcon from "@mui/icons-material/Article";
import FolderIcon from "@mui/icons-material/Folder";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import TreeItem, { TreeItemContentProps, TreeItemProps, useTreeItem } from "@mui/lab/TreeItem";
import TreeView from "@mui/lab/TreeView";
import { Button, Drawer, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import clsx from "clsx";
import React, { forwardRef, useEffect, useState } from "react";

import { DirTree, useDirTree } from "./dirTree";

interface DirHandleProp {
  type: string;
  handleOpen: () => void;
  handleMenu: (event: MouseEvent) => void;
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
    type,
    handleOpen,
    handleMenu,
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
        onClick={handleMenu}
        sx={{ marginLeft: "auto" }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
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
  onClose: () => void;
  root: string;
}) {
  const dirTree = props.dirTree;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const renderTree = (node: DirTree) => {
    return (
      <DirItem
        key={node.name}
        nodeId={node.name}
        label={node.name}
        icon={node.type == "dir" ? <FolderIcon /> : <ArticleIcon />}
        handle={{
          handleOpen: () => props.handleOpen(node.name),
          handleMenu: handleMenuClick,
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
      <Menu
        id="filemenu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Rename</MenuItem>
        <MenuItem onClick={handleMenuClose}>Move</MenuItem>
        <MenuItem onClick={handleMenuClose}>Delete</MenuItem>
      </Menu>
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

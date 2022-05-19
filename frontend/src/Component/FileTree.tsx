import ArticleIcon from "@mui/icons-material/Article";
import FolderIcon from "@mui/icons-material/Folder";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import TreeItem, { TreeItemContentProps, TreeItemProps, useTreeItem } from "@mui/lab/TreeItem";
import TreeView from "@mui/lab/TreeView";
import { Button, Drawer, IconButton, Typography } from "@mui/material";
import clsx from "clsx";
import React, { forwardRef, useEffect, useState } from "react";

import { DirTree, useDirTree } from "./dirTree";

const DirContent = forwardRef(function DirContent(
  props: TreeItemContentProps & { onClick: () => void },
  ref,
) {
  const {
    classes,
    className,
    label,
    nodeId,
    icon,
    onClick,
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
    onClick();
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
      onClick={handleClick}
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
      >
        {label}
      </Typography>

      <IconButton
        onClick={() => console.log("not implemented")}
        sx={{ marginLeft: "auto" }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
    </div>
  );
});

const DirItem = (props: TreeItemProps & { onClick: () => void }) => (
  <TreeItem ContentComponent={DirContent} {...props} />
);

export function FileTreeInner(props: {
  dirTree: DirTree;
  width: number;
  open: boolean;
  onClick: (f: string) => void;
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
        onClick={() => props.onClick(node.name)}
        icon={node.type == "dir" ? <FolderIcon /> : <ArticleIcon />}
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

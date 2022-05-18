import { TreeItem, TreeView } from "@mui/lab";
import { Drawer } from "@mui/material";
import { useEffect, useState } from "react";

import { FsManager } from "../Model/FsManager";
import { RPCManager as rpcman } from "../Model/RPCManager";

const manager = new FsManager(rpcman);

async function collectDirTree(path: string, name: string) {
  const res = await manager.getStat(path);

  if (res.isDirectory) {
    const proms = res.entries.map(async (entry) => {
      return await collectDirTree(path + "/" + entry.name, entry.name);
    });

    const children = await Promise.all(proms);

    return { name: name, children };
  } else {
    return { name: name };
  }
}

function useDirTree(path) {
  const [dirtree, setDirtree] = useState(null);

  const getDirTree = async () => {
    const d = await collectDirTree(path, "/");
    setDirtree(d);
  };

  useEffect(() => {
    if (!dirtree) {
      getDirTree();
    }
  });

  return dirtree;
}

export function FileTreeInner(props: {
  dirTree;
  width: number;
  open: boolean;
  onClick: (f: string) => void;
  onClose: () => void;
  root: string;
}) {
  const dirTree = props.dirTree;

  const renderTree = (node) => {
    return (
      <TreeItem
        key={node.name}
        nodeId={node.name}
        label={node.name}
        onClick={() => props.onClick(node.name)}
      >
        {Array.isArray(node.children)
          ? node.children.map(renderTree)
          : null}
      </TreeItem>
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

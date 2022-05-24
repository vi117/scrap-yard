import { useEffect, useState } from "react";

import { getFsManagerInstance } from "../Model/mod";

export type DirTree = {
  type: string;
  name: string;
  path: string;
  children?: DirTree[];
};

async function collectDirTree(path: string, name: string): Promise<DirTree> {
  const manager = await getFsManagerInstance();
  const res = await manager.getStat(path);

  if (res.isDirectory) {
    const proms = (res.entries ?? []).map(async (entry) => {
      return await collectDirTree(path + "/" + entry.name, entry.name);
    });

    const children = await Promise.all(proms);

    return { type: "dir", name: name, path: path, children };
  } else {
    return { type: "file", name: name, path: path };
  }
}

export function useDirTree(path: string): DirTree | null {
  const [dirtree, setDirtree] = useState<DirTree | null>(null);

  const getDirTree = async () => {
    const d = await collectDirTree(path + "/", "/");
    setDirtree(d);
  };

  useEffect(() => {
    if (!dirtree) {
      getDirTree();
    }
  });

  return dirtree;
}

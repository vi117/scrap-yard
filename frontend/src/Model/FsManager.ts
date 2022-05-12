import { RPCMessageManager } from "./mod";

export interface FsDirEntry {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
  isSymlink: boolean;
}

export interface FsStatInfo {
  /**
   * True if this is info for a regular file. Mutually exclusive to
   * `FileInfo.isDirectory` and `FileInfo.isSymlink`.
   */
  isFile: boolean;
  /** True if this is info for a regular directory. Mutually exclusive to
   * `FileInfo.isFile` and `FileInfo.isSymlink`. */
  isDirectory: boolean;
  /** True if this is info for a symlink. Mutually exclusive to
   * `FileInfo.isFile` and `FileInfo.isDirectory`. */
  isSymlink: boolean;
  /** The size of the file, in bytes. */
  size: number;
  /** The last modification time of the file. This corresponds to the `mtime`
   * field from `stat` on Linux/Mac OS and `ftLastWriteTime` on Windows. This
   * may not be available on all platforms. */
  mtime: Date | null;
  /** The last access time of the file. This corresponds to the `atime`
   * field from `stat` on Unix and `ftLastAccessTime` on Windows. This may not
   * be available on all platforms. */
  atime: Date | null;
  /** The creation time of the file. This corresponds to the `birthtime`
   * field from `stat` on Mac/BSD and `ftCreationTime` on Windows. This may
   * not be available on all platforms. */
  birthtime: Date | null;
}

export interface FsGetResult extends FsStatInfo {
  /**
   * directory entry
   * if `isDirectory` is true, this is directory entry
   * if `isFile` is true, there is no entries.
   */
  entries?: FsDirEntry[];
}

export type NotImplemented = () => never;

export interface IFsEventMap {
  "modify": (this: IFsManager, event: MessageEvent<NotImplemented>) => void;
  "create": (this: IFsManager, event: MessageEvent<NotImplemented>) => void;
  "delete": (this: IFsManager, event: MessageEvent<NotImplemented>) => void;
}

export interface IFsManager extends EventTarget {
  get(path: string): Promise<Response>;
  getInfo(path: string): Promise<FsGetResult>;
  putFs(filePath: string, data: BodyInit): Promise<void>;
  deleteFS(filePath: string): Promise<void>;

  addEventListener(
    name: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    name: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void;
  dispatchEvent(event: Event): boolean;
}

export class FsManager extends EventTarget implements IFsManager {
  private manager: RPCMessageManager;
  private prefix: string;
  constructor(manager: RPCMessageManager) {
    super();
    this.manager = manager;
    this.prefix = "/fs/";
  }
  async get(path: string): Promise<Response> {
    const url = new URL(this.prefix + path);
    const res = await fetch(url);
    return res;
  }

  async getInfo(filePath: string): Promise<FsGetResult> {
    const url = new URL(this.prefix + filePath);
    url.searchParams.set("stat", "true");
    const res = await fetch(url);
    const info = await res.json() as FsGetResult;
    return info;
  }

  async putFs(filePath: string, data: BodyInit): Promise<void> {
    const url = new URL(this.prefix + filePath);
    const res = await fetch(url, {
      method: "PUT",
      body: data,
    });
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    await res.json();
  }

  async deleteFS(filePath: string): Promise<void> {
    const url = new URL(this.prefix + filePath);
    const res = await fetch(url, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    await res.json();
  }
}

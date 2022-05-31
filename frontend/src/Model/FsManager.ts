import {
    getOpenedManagerInstance,
    getServerInfoInstance,
    IRPCMessageManager,
} from "./mod";

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
    getURL(filePath: string): URL;
    get(path: string): Promise<Response>;
    getStat(path: string): Promise<FsGetResult>;
    upload(filePath: string, data: BodyInit): Promise<number>;
    delete(filePath: string): Promise<number>;
    mkdir(path: string): Promise<number>;

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
    private manager: IRPCMessageManager;
    /**
     * end point url. end with '/'
     */
    private url: string;
    constructor(manager: IRPCMessageManager, url: string) {
        super();
        this.manager = manager;
        this.url = url;
    }

    getURL(filePath: string): URL {
        if (filePath.startsWith("/")) {
            filePath = "." + filePath;
        }
        const url = new URL(filePath, this.url);
        return url;
    }

    /**
     * fetch file
     * @param filePath path to file
     * @returns content of file
     */
    async get(filePath: string): Promise<Response> {
        const url = this.getURL(filePath);
        const res = await fetch(url);
        return res;
    }

    /**
     * get file info. directory too.
     * @param path
     * @returns file info
     * @throws Error if not found
     * @example
     * ```
     * const info = await fs.getInfo("test.txt");
     * console.log(info.isFile);
     * ```
     * @example
     * ```
     * const info = await fs.getInfo("directory");
     * console.log(info.isDirectory);
     * console.log(info.entries);
     * ```
     */
    async getStat(filePath: string): Promise<FsGetResult> {
        const url = this.getURL(filePath);
        url.searchParams.set("stat", "true");
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(res.statusText);
        }
        const info = await res.json() as FsGetResult;
        return info;
    }
    /**
     * upload file to server
     * @param filePath upload file path
     * @param data upload data
     * @returns status code
     */
    async upload(filePath: string, data: BodyInit): Promise<number> {
        const url = this.getURL(filePath);
        const res = await fetch(url, {
            method: "PUT",
            body: data,
        });
        if (!res.ok) {
            throw new Error(res.statusText);
        }
        return res.status;
    }
    /**
     * make directory
     * @param filePath
     * @returns status code
     */
    async mkdir(filePath: string): Promise<number> {
        const url = this.getURL(filePath);
        url.searchParams.set("makeDir", "true");
        const res = await fetch(url, {
            method: "PUT",
        });
        if (!res.ok) {
            throw new Error(res.statusText);
        }
        return res.status;
    }
    /**
     * delete file or directory
     * @param filePath file path
     * @returns status code
     * @throws Error if not found
     * @example
     * ```
     * await fs.delete("test.txt");
     * ```
     */
    async delete(filePath: string): Promise<number> {
        const url = this.getURL(filePath);
        const res = await fetch(url, {
            method: "DELETE",
        });
        if (!res.ok) {
            throw new Error(res.statusText);
        }
        await res.json();
        return res.status;
    }
}

let fs: IFsManager | null = null;

export async function getFsManagerInstance(): Promise<IFsManager> {
    if (!fs) {
        const manager = await getOpenedManagerInstance();
        const info = await getServerInfoInstance();
        const url = new URL("fs/", `http://${info.host}:${info.port}`);
        console.log("fs url ", url);
        fs = new FsManager(manager, url.href);
    }
    return fs;
}

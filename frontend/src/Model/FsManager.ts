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

/**
 * File Event Class
 * @param kind "create" | "modify" | "remove"
 * @param paths file paths
 */
export class FileEvent<T extends FileEventType> extends Event {
    constructor(public readonly kind: T, public readonly path: string[]) {
        super(kind);
    }
}

export interface IFsEventMap {
    "modify": FileEvent<"modify">;
    "create": FileEvent<"create">;
    "remove": FileEvent<"remove">;
}
export type FileEventType = keyof IFsEventMap;

type EventHandler<T extends FileEventType> = (
    this: IFsManager,
    event: FileEvent<T>,
) => void;

export interface IFsManager extends EventTarget {
    /**
     * get url of the file or directory
     * @param filePath file path
     * @returns url of the file or directory
     * ```ts
     * const url = fsManager.getUrl("/path/to/file");
     * ```
     */
    getURL(filePath: string): URL;
    /**
     * fetch file
     * @param filePath path to file
     * @returns content of file
     */
    get(path: string): Promise<Response>;
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
    getStat(path: string): Promise<FsGetResult>;
    /**
     * upload file to server
     * @param filePath upload file path
     * @param data upload data
     * @returns status code
     */
    upload(filePath: string, data: BodyInit): Promise<number>;
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
    delete(filePath: string): Promise<number>;
    /**
     * make directory
     * it will create parent directory if not exists.
     * @param path file path
     * @returns status code
     */
    mkdir(path: string): Promise<number>;

    /**
     * add event listener for file or directory
     * @param type "create" | "modify" | "remove"
     * @param listener event listener
     * ```ts
     * fsManager.addEventListener("create", (event) => {
     *    console.log(event.path);
     * });
     * ```
     */
    addEventListener<T extends keyof IFsEventMap>(
        type: T,
        listener: EventHandler<T>,
    ): void;
    addEventListener(
        name: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | EventListenerOptions,
    ): void;

    removeEventListener<T extends keyof IFsEventMap>(
        type: T,
        listener: EventHandler<T>,
    ): void;

    removeEventListener(
        name: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | EventListenerOptions,
    ): void;

    /**
     * emit event.
     * do not use this method. it is for internal use.
     * @param event event
     */
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

        this.manager.addEventListener("notification", (event) => {
            const { method, params } = event.data;
            if (method === "file.update") {
                const paths = params.paths;
                const event = new FileEvent(params.eventType, paths);
                console.log("file.update", event);
                this.dispatchEvent(event);
            }
        });
    }

    addEventListener<T extends keyof IFsEventMap>(
        type: string,
        callback: EventListenerOrEventListenerObject | null | EventHandler<T>,
        options?: boolean | AddEventListenerOptions | undefined,
    ): void {
        super.addEventListener(
            type,
            callback as EventListenerOrEventListenerObject,
            options,
        );
    }

    removeEventListener<T extends keyof IFsEventMap>(
        type: string,
        callback: EventListenerOrEventListenerObject | null | EventHandler<T>,
        options?: boolean | EventListenerOptions,
    ): void {
        super.removeEventListener(
            type,
            callback as EventListenerOrEventListenerObject,
            options,
        );
    }

    getURL(filePath: string): URL {
        if (filePath.startsWith("/")) {
            filePath = "." + filePath;
        }
        const url = new URL(filePath, this.url);
        return url;
    }

    async #fetchRequest(
        filePath: string | URL,
        init?: RequestInit,
    ): Promise<Response> {
        let url;
        if (typeof filePath === "string") {
            url = this.getURL(filePath);
        } else {
            url = filePath;
        }
        const res = new Request(url.href, {
            credentials: "include",
            ...init,
        });
        return await fetch(res);
    }

    async get(filePath: string): Promise<Response> {
        const res = await this.#fetchRequest(filePath);
        return res;
    }

    async getStat(filePath: string): Promise<FsGetResult> {
        const url = this.getURL(filePath);
        url.searchParams.set("stat", "true");
        const res = await this.#fetchRequest(url);
        if (!res.ok) {
            throw new Error(res.statusText);
        }
        const info = await res.json() as FsGetResult;
        return info;
    }

    async upload(filePath: string, data: BodyInit): Promise<number> {
        const res = await this.#fetchRequest(filePath, {
            method: "PUT",
            body: data,
        });
        if (!res.ok) {
            throw new Error(res.statusText);
        }
        return res.status;
    }

    async mkdir(filePath: string): Promise<number> {
        const url = this.getURL(filePath);
        url.searchParams.set("makeDir", "true");
        const res = await this.#fetchRequest(url, {
            method: "PUT",
        });
        if (!res.ok) {
            throw new Error(res.statusText);
        }
        return res.status;
    }

    async delete(filePath: string): Promise<number> {
        const res = await this.#fetchRequest(filePath, {
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

// for debug
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).getFsManagerInstance = getFsManagerInstance;

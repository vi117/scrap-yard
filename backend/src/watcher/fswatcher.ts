import { AllParticipants } from "../rpc/connection.ts";
import * as RPC from "model";
import { relative } from "std/path";

export type FsWatchEventType = "create" | "modify" | "remove";

export class FsWatcherEvent extends Event {
    constructor(type: FsWatchEventType, public paths: string[]) {
        super(type);
    }
}

export class FsWatcher extends EventTarget {
    private path: string;
    private watcher?: Deno.FsWatcher;
    private filterFns: ((path: string, kind: string) => boolean)[] = [];
    constructor(path: string) {
        super();
        this.path = path;
    }

    addFilter(fn: (path: string, kind: string) => boolean) {
        this.filterFns.push(fn);
    }
    removeFilter(fn: (path: string, kind: string) => boolean) {
        const index = this.filterFns.indexOf(fn);
        if (index >= 0) {
            this.filterFns.splice(index, 1);
            return true;
        }
        return false;
    }
    startWatching(): void {
        const watcher = Deno.watchFs(this.path, { recursive: true });
        (async () => {
            for await (const event of watcher) {
                const cwd = Deno.cwd();

                let paths = event.paths.map((x) => relative(cwd, x));
                const filterFns = [...this.filterFns];
                paths = paths.filter((x) =>
                    filterFns.every((fn) => fn(x, event.kind))
                );

                if (paths.length == 0) continue;

                if (event.kind === "create") {
                    const e = new FsWatcherEvent("create", paths);
                    this.dispatchEvent(e);
                } else if (event.kind === "modify") {
                    const e = new FsWatcherEvent("modify", paths);
                    this.dispatchEvent(e);
                } else if (event.kind === "remove") {
                    const e = new FsWatcherEvent("remove", paths);
                    this.dispatchEvent(e);
                }
            }
        })();
        this.watcher = watcher;
    }
    stopWatching(): void {
        if (this.watcher) {
            this.watcher.close();
        }
    }
    addEventListener(
        type: FsWatchEventType,
        handler: (e: FsWatcherEvent) => void,
    ): void;
    addEventListener(
        type: string,
        handler: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
        type: string,
        handler:
            | ((e: FsWatcherEvent) => void)
            | EventListenerOrEventListenerObject
            | null,
        options?: boolean | AddEventListenerOptions,
    ): void {
        return super.addEventListener(type, handler as EventListener, options);
    }
}

function makeFileNotification(
    event: FsWatcherEvent,
): RPC.RPCNotification {
    const params = {
        eventType: event.type as RPC.FileNotifyEventType,
        paths: event.paths,
    };
    return {
        jsonrpc: "2.0",
        method: "file.update",
        params,
    };
}

export function startWatching(path: string) {
    const watcher = new FsWatcher(path);
    watcher.addEventListener("create", (e) => {
        AllParticipants.broadcastNotification(
            makeFileNotification(e as FsWatcherEvent),
        );
    });
    watcher.addEventListener("remove", (e) => {
        AllParticipants.broadcastNotification(
            makeFileNotification(e as FsWatcherEvent),
        );
    });
    watcher.addEventListener("modify", (e) => {
        AllParticipants.broadcastNotification(
            makeFileNotification(e as FsWatcherEvent),
        );
    });
    watcher.startWatching();
    return watcher;
}

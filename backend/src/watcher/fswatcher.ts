import { AllParticipants } from "../rpc/connection.ts";
import * as RPC from "model";

export type FsWatchEventType = "create" | "modify" | "remove";

export class FsWatcherEvent extends Event {
    constructor(type: FsWatchEventType, public paths: string[]) {
        super(type);
    }
}

export class FsWatcher extends EventTarget {
    private path: string;
    private watcher?: Deno.FsWatcher;
    constructor(path: string) {
        super();
        this.path = path;
    }
    startWatching(): void {
        const watcher = Deno.watchFs(this.path, { recursive: true });
        (async () => {
            for await (const event of watcher) {
                if (event.kind === "create") {
                    const e = new FsWatcherEvent("create", event.paths);
                    this.dispatchEvent(e);
                } else if (event.kind === "modify") {
                    const e = new FsWatcherEvent("modify", event.paths);
                    this.dispatchEvent(e);
                } else if (event.kind === "remove") {
                    const e = new FsWatcherEvent("remove", event.paths);
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

export function startWatching() {
    const watcher = new FsWatcher("src/watcher/fswatcher.ts");
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
}

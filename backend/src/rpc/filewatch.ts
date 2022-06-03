import { AllParticipants, Participant } from "../rpc/connection.ts";
import * as RPC from "model";
import { FsWatcher, FsWatcherEvent } from "../watcher/mod.ts";
import * as log from "std/log";

function makeFileNotification(
    conn: Participant,
    event: FsWatcherEvent,
): RPC.RPCNotification {
    const params = {
        eventType: event.type as RPC.FileNotifyEventType,
        paths: event.paths.map((x) => conn.user.relativePath(x)),
    };
    return {
        jsonrpc: "2.0",
        method: "file.update",
        params,
    };
}

export function initWatching(path: string) {
    const watcher = new FsWatcher(path);
    const sendEvent = (event: FsWatcherEvent) => {
        for (const conn of AllParticipants) {
            conn.sendNotification(makeFileNotification(conn, event));
        }
    };

    watcher.addEventListener("create", (e) => {
        log.debug(`File created: ${e.paths}`);
        sendEvent(e);
    });
    watcher.addEventListener("remove", (e) => {
        log.debug(`File remove: ${e.paths}`);
        sendEvent(e);
    });
    watcher.addEventListener("modify", (e) => {
        log.debug(`File modify: ${e.paths}`);
        sendEvent(e);
    });

    return watcher;
}

export const fileWatcher = initWatching(".");

import { assertEquals } from "std/assert";
import { FsWatcher, FsWatcherEvent } from "./fswatcher.ts";
import { getCurrentScriptDir } from "../util.ts";
import { AtomicReadWriter, WatchFilteredReadWriter } from "./readWriter.ts";
import { join as pathJoin } from "std/path";

Deno.test({
    name: "WatchFilteredReadWriter",
    fn: async () => {
        const curPath = getCurrentScriptDir(import.meta);

        const watchPath = pathJoin(curPath, "testdata");
        const watcher = new FsWatcher(watchPath);
        const buf: string[] = [];
        watcher.addEventListener("create", (e: FsWatcherEvent) => {
            buf.push(`create ${e.paths.join(" ")}`);
        });
        watcher.addEventListener("modify", (e: FsWatcherEvent) => {
            buf.push(`modify ${e.paths.join(" ")}`);
        });
        watcher.addEventListener("remove", (e: FsWatcherEvent) => {
            buf.push(`remove ${e.paths.join(" ")}`);
        });
        try {
            watcher.startWatching();
            await new Promise((resolve: (value: unknown) => void) => {
                setTimeout(async () => {
                    const rw = new AtomicReadWriter();
                    const fillter = new WatchFilteredReadWriter(watcher, rw);
                    await fillter.write(
                        pathJoin(curPath, "testdata", "test.txt"),
                        "hello world",
                    );
                    await rw.write(
                        pathJoin(curPath, "testdata", "test1.txt"),
                        "hello world",
                    );
                    setTimeout(() => {
                        resolve(null);
                    }, 10);
                }, 10);
            });
        } finally {
            await watcher.stopWatching();
        }
        const test1_path = pathJoin(curPath, "testdata", "test1.txt");
        assertEquals(
            buf,
            [`remove ${test1_path}`, `create ${test1_path}`],
        );
    },
});

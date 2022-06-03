import { normalize } from "std/path";
import * as log from "std/log";
import { FsWatcher } from "./fswatcher.ts";
import { writeAll } from "std/streams";

type Command = {
    path: string;
    content: string;
};

export interface IReadWriter {
    read(path: string): Promise<string>;
    write(path: string, content: string): Promise<void>;
}

export class RawReadWriter implements IReadWriter {
    async read(path: string): Promise<string> {
        return await Deno.readTextFile(path);
    }
    async write(path: string, content: string): Promise<void> {
        const file = await Deno.open(path, { create: true, write: true });
        const p = new TextEncoder().encode(content);
        await file.truncate(0);
        await writeAll(file, p);
        file.close();
    }
}

export class WatchFilteredReadWriter implements IReadWriter {
    private readonly raw: IReadWriter;
    private fsWatcher: FsWatcher;
    constructor(fsWatcher: FsWatcher, raw: IReadWriter) {
        this.fsWatcher = fsWatcher;
        this.raw = raw;
    }
    async read(path: string): Promise<string> {
        return await this.raw.read(path);
    }
    async write(path: string, content: string): Promise<void> {
        path = normalize(path);
        // TODO: impl content based filtering
        // Because we don't know how many times the file event has occurred when we modify contents.
        let count = 3;
        const now = Date.now();
        const filter = (p: string, kind: string) => {
            // if filter is old, ignore it
            if (Date.now() - now > 10) {
                this.fsWatcher.removeFilter(filter);
                return true;
            }
            if (kind === "modify" && path === p) {
                count -= 1;
                if (count == 0) {
                    this.fsWatcher.removeFilter(filter);
                }
                return false;
            }
            return true;
        };
        this.fsWatcher.addFilter(filter);
        await this.raw.write(path, content);
    }
}

export class QueueReadWriter implements IReadWriter {
    /**
     * queue length is commonly less than 10
     */
    private queue: Command[] = [];
    started = false;
    private waitedResolve: (() => void) | undefined;
    constructor(
        public delayCount: number,
        public baseReadWriter: IReadWriter,
    ) { }
    async read(path: string): Promise<string> {
        return await this.baseReadWriter.read(path);
    }
    write(path: string, content: string): Promise<void> {
        this.save(path, content);
        return Promise.resolve();
    }

    save(path: string, content: string) {
        // it is O(n) to find the command
        const cmd = this.queue.find((cmd) => cmd.path === path);
        if (cmd) {
            cmd.content = content;
        } else {
            this.queue.push({ path, content });
            this.startTimer();
        }
    }
    startTimer() {
        if (this.started) return;
        this.started = true;
        setTimeout(() => {
            this.started = false;
            if (this.queue.length > 0) {
                this.startTimer();
            } else {
                if (this.waitedResolve) {
                    this.waitedResolve();
                }
            }
        }, this.delayCount);
        this.flush();
    }
    async flush() {
        if (this.queue.length === 0) return;
        if (this.queue.length >= 100) {
            log.warning("saveDocCollector queue is too long");
        }
        const cmds = this.queue;
        this.queue = [];
        await Promise.all(cmds.map(async (cmd) => {
            try {
                await this.baseReadWriter.write(cmd.path, cmd.content);
            } catch (e) {
                if (e instanceof Deno.errors.NotFound) {
                    // ignore
                } else {
                    throw e;
                }
            }
        }));
    }
    wait(): Promise<void> {
        return new Promise((resolve) => {
            this.waitedResolve = resolve;
        });
    }
}

export const QueuingSaveDocReadWriter = new QueueReadWriter(
    1000,
    new RawReadWriter(),
);

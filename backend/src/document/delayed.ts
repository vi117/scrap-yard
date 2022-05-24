import { readDocFile, saveDocFile, WriteDocFileOptions } from "./filedoc.ts";
import { DocReadWriter, DocumentContent } from "./doc.ts";

type Command = {
    path: string;
    doc: DocumentContent;
};

export class SaveDocCollector {
    /**
     * queue length is commonly less than 10
     */
    private queue: Command[] = [];
    started = false;
    waitedResolve: (() => void) | undefined;
    constructor(public delayCount: number) {}
    save(path: string, doc: DocumentContent) {
        // it is O(n) to find the command
        const cmd = this.queue.find((cmd) => cmd.path === path);
        if (cmd) {
            cmd.doc = doc;
        } else {
            this.queue.push({ path, doc });
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
        await Promise.all(this.queue.map(async (cmd) => {
            try {
                await saveDocFile(cmd.path, {
                    chunks: cmd.doc.chunks,
                    tags: cmd.doc.tags,
                    version: 1,
                });
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
const collector = new SaveDocCollector(1000);

class SaveDocType implements DocReadWriter {
    async read(path: string): Promise<DocumentContent> {
        return await readDocFile(path);
    }
    save(path: string, doc: DocumentContent): Promise<void> {
        collector.save(path, doc);
        return Promise.resolve();
    }
}

export const QueuingSaveDocReadWriter = new SaveDocType();

export function startSaveTimer() {
    if (collector.started) return;
    collector.startTimer();
}
export async function stopSaveTimer() {
    await collector.wait();
}

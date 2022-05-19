import { saveDocFile, WriteDocFileOptions } from "./filedoc.ts";
import { DocumentObject } from "model";

type Command = {
  path: string;
  doc: DocumentObject;
};

export class SaveDocCollector {
  /**
   * queue length is commonly less than 10
   */
  private queue: Command[] = [];
  started = false;
  constructor(public delayCount: number) {}
  save(path: string, doc: DocumentObject) {
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
}
// const collector = new SaveDocCollector(1000);

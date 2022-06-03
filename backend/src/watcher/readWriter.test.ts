import { IReadWriter, QueueReadWriter } from "./readWriter.ts";
import { assertEquals } from "std/assert";

class MockReadWriter implements IReadWriter {
    readonly data: Record<string, string> = {};
    read(path: string): Promise<string> {
        return Promise.resolve(this.data[path]);
    }
    write(path: string, content: string): Promise<void> {
        this.data[path] = content;
        return Promise.resolve();
    }
}

Deno.test({
    name: "QueueReadWriter",
    fn: async () => {
        const mock = new MockReadWriter();
        const qrw = new QueueReadWriter(10, mock);
        await qrw.write("test.txt", "test");
        await qrw.write("foo.txt", "foo");
        await qrw.wait();
        assertEquals(mock.data["test.txt"], "test");
        assertEquals(mock.data["foo.txt"], "foo");
    },
});

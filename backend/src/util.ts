import { fromFileUrl, join as pathJoin, relative } from "std/path";

export async function asyncAll<T>(a: AsyncIterable<T>): Promise<Awaited<T>[]> {
    const ret = [];
    for await (const v of a) {
        ret.push(v);
    }
    return ret;
}

export class IdGenerator {
    private id = 0;
    next(): number {
        return this.id++;
    }
}

export function getCurrentScriptDir(importMeta: ImportMeta): string {
    const scriptDir = pathJoin(
        relative(Deno.cwd(), fromFileUrl(importMeta.url)),
        "..",
    );
    return scriptDir;
}

export interface IDisposable {
    dispose(): void;
}

export class RefCountDisposable implements IDisposable {
    private refCount = 0;
    private handlers: (() => void)[] = [];
    dispose(): void {
        if (this.refCount > 0) {
            this.refCount--;
            return;
        }
        this.handlers.forEach((handler) => handler());
    }
    disposeForced(): void {
        this.handlers.forEach((handler) => handler());
    }
    addRef(): void {
        this.refCount++;
    }
    addDisposeHandler(handler: () => void): void {
        this.handlers.push(handler);
    }
}

export class RefCountSet<T> {
    private items: Map<T, RefCountDisposable> = new Map();
    add(item: T, disposeHandler?: () => void): void {
        const disposable = this.items.get(item);
        if (disposable) {
            disposable.addRef();
            return;
        }
        const newDisposable = new RefCountDisposable();
        this.items.set(item, newDisposable);
        newDisposable.addDisposeHandler(() => this.items.delete(item));
        if (disposeHandler) {
            newDisposable.addDisposeHandler(disposeHandler);
        }
    }
    addDisposeHandler(item: T, handler: () => void): boolean {
        const disposable = this.items.get(item);
        if (disposable) {
            disposable.addDisposeHandler(handler);
        }
        return !!disposable;
    }
    delete(item: T): void {
        const disposable = this.items.get(item);
        if (disposable) {
            disposable.dispose();
        }
    }
    deleteForced(item: T): void {
        const disposable = this.items.get(item);
        if (disposable) {
            disposable.disposeForced();
        }
    }
    clear(): void {
        this.items.forEach((disposable) => disposable.disposeForced());
        this.items.clear();
    }

    get size(): number {
        return this.items.size;
    }
    has(item: T): boolean {
        return this.items.has(item);
    }
    values(): IterableIterator<T> {
        return this.items.keys();
    }
    [Symbol.iterator](): IterableIterator<T> {
        return this.items.keys();
    }
}

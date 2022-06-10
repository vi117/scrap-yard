import * as RPC from "model";
import { AtomicReadWriter, QueueReadWriter } from "../watcher/readWriter.ts";
import { sessionStore } from "./session.ts";
import { createUser } from "./user.ts";
import * as log from "std/log";

export interface ShareDocInfo extends RPC.ShareDocDescription {
    shareToken: string;
}

export interface ShareDocStore {
    get(docPath: string): ShareDocInfo | undefined;
    set(docPath: string, info: ShareDocInfo): this;
    delete(docPath: string): boolean;
}

class ShareDocStoreType extends Map<string, ShareDocInfo>
    implements ShareDocStore {
    set(docPath: string, info: ShareDocInfo): this {
        sessionStore.set(
            info.shareToken,
            createUser(info.shareToken, {
                basepath: info.basePath,
                write: info.write,
                expiredAt: info.expired,
            }),
        );
        return super.set(docPath, info);
    }
    delete(docPath: string): boolean {
        const info = this.get(docPath);
        if (info) {
            sessionStore.delete(info.shareToken);
        }
        return super.delete(docPath);
    }

    toJSON(): { [key: string]: ShareDocInfo } {
        const json: { [key: string]: ShareDocInfo } = {};
        for (const [k, v] of super.entries()) {
            json[k] = v;
        }
        return json;
    }
    load(json: { [key: string]: ShareDocInfo }): void {
        for (const [k, v] of Object.entries(json)) {
            this.set(k, v);
        }
    }
}

export const ShareDocStore = new ShareDocStoreType();
export const ShareDocStoreRW = new QueueReadWriter(10, new AtomicReadWriter());
let ShareDocStorePath = "";
export function setShareDocStorePath(path: string): void {
    ShareDocStorePath = path;
}

export async function loadShareDocStore(): Promise<void> {
    let data: string;
    try {
        data = await ShareDocStoreRW.read(ShareDocStorePath);
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            log.info("share doc store file not found");
            await ShareDocStoreRW.write(ShareDocStorePath, "{}");
        } else {
            throw error;
        }
        data = "{}";
    }
    ShareDocStore.load(JSON.parse(data));
}
export async function saveShareDocStore() {
    await ShareDocStoreRW.write(
        ShareDocStorePath,
        JSON.stringify(ShareDocStore),
    );
}

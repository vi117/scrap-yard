import { handleShareMethod } from "./share.ts";
import { MockUser } from "./mockuser.ts";
import {
    getShareDocStoreRw,
    setShareDocStoreRw,
    ShareDocStore,
} from "../auth/docShare.ts";
import {
    RPCErrorCode,
    ShareDocMethod,
    ShareDocResult,
    ShareGetInfoMethod,
    ShareGetInfoResult,
} from "model";
import { assertEquals } from "std/assert";
import { MemoryReadWriter } from "../watcher/readWriter.ts";

Deno.test({
    name: "handleShareGetInfo",
    fn: async () => {
        const restore = getShareDocStoreRw();
        setShareDocStoreRw(new MemoryReadWriter());
        try {
            const conn = new MockUser("conn");
            const shareToken = "shareToken";
            const expired = Date.now() + 1000 * 60 * 60 * 24 * 7;
            ShareDocStore.set("path/to/doc1.json", {
                basePath: "path/to",
                shareToken,
                expired: expired,
                write: false,
            });
            const method: ShareGetInfoMethod = {
                id: 1,
                method: "share.info",
                params: {
                    docPath: "path/to/doc1.json",
                },
                jsonrpc: "2.0",
            };
            await handleShareMethod(conn, method);
            const res = conn.popObject();
            const result = res.result as ShareGetInfoResult;
            assertEquals(result.desc, {
                basePath: "path/to",
                expired: expired,
                write: false,
            });
            assertEquals(result.token, shareToken);
        } finally {
            setShareDocStoreRw(restore);
        }
    },
});

Deno.test({
    name: "handleShareDocMethod",
    fn: async () => {
        const restore = getShareDocStoreRw();
        setShareDocStoreRw(new MemoryReadWriter());
        try {
            const conn = new MockUser("conn");
            const expired = Date.now() + 1000 * 60 * 60 * 24 * 7;

            const method: ShareDocMethod = {
                id: 1,
                method: "share.doc",
                params: {
                    docPath: "path/to/doc1.json",
                    expired: expired,
                },
                jsonrpc: "2.0",
            };
            await handleShareMethod(conn, method);
            const res = conn.popObject();
            const result = res.result as ShareDocResult;
            assertEquals(result.docPath, "path/to/doc1.json");
            const shareToken = result.token;
            assertEquals(ShareDocStore.get("path/to/doc1.json"), {
                basePath: "path/to", // default value is dirname of docPath
                shareToken: shareToken,
                expired: expired,
                write: false, // default value is false
            });
        } finally {
            setShareDocStoreRw(restore);
        }
    },
});

Deno.test({
    name: "handleShareMethod with no existing share token",
    fn: async () => {
        const restore = getShareDocStoreRw();
        setShareDocStoreRw(new MemoryReadWriter());
        try {
            const conn = new MockUser("conn");
            const method: ShareGetInfoMethod = {
                id: 1,
                method: "share.info",
                params: {
                    docPath: "path/to/not_exist.json",
                },
                jsonrpc: "2.0",
            };
            await handleShareMethod(conn, method);
            const res = conn.popObject();
            const result = res.error as {
                code: number;
                message: string;
                data: string;
            };
            assertEquals(result.code, RPCErrorCode.InvalidDocPath);
            assertEquals(result.data, "path/to/not_exist.json");
        } finally {
            setShareDocStoreRw(restore);
        }
    },
});

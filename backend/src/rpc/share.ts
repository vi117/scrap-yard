import { Participant } from "./connection.ts";
import {
    InvalidDocPathError,
    makeRPCError,
    makeRPCResult,
    PermissionDeniedError,
    ShareDocMethod,
    ShareDocResult,
    ShareGetInfoMethod,
    ShareGetInfoResult,
    ShareMethod,
} from "model";
import { makeSessionId } from "../auth/session.ts";
import { saveShareDocStore, ShareDocStore } from "../auth/docShare.ts";
import { dirname } from "std/path";

export async function handleShareDocMethod(
    conn: Participant,
    method: ShareDocMethod,
): Promise<void> {
    const param = method.params;
    if (!conn.user.canCustom("shareToken", {})) {
        conn.responseWith(
            makeRPCError(method.id, new PermissionDeniedError("shareToken")),
        );
        return;
    }

    const shareInfo = ShareDocStore.get(param.docPath);
    let shareToken: string;
    if (shareInfo == undefined) {
        //create share token
        shareToken = makeSessionId();
        ShareDocStore.set(param.docPath, {
            basePath: dirname(param.docPath),
            shareToken,
            expired: param.expired ?? Date.now() + 1000 * 60 * 60 * 24 * 7,
            write: param.write ?? false,
        });
    } else {
        shareToken = shareInfo.shareToken;
        //update share token info
        ShareDocStore.set(param.docPath, {
            basePath: param.basePath ?? shareInfo.basePath,
            shareToken: shareToken,
            expired: param.expired ?? shareInfo.expired,
            write: param.write ?? shareInfo.write,
        });
    }
    await saveShareDocStore();
    const result: ShareDocResult = {
        docPath: param.docPath,
        token: shareToken,
    };
    conn.responseWith(makeRPCResult(method.id, result));
}

export function handleShareGetInfo(
    conn: Participant,
    method: ShareGetInfoMethod,
) {
    if (!conn.user.canCustom("shareToken", {})) {
        conn.responseWith(
            makeRPCError(method.id, new PermissionDeniedError("shareToken")),
        );
        return;
    }
    const params = method.params;
    const shareInfo = ShareDocStore.get(params.docPath);
    if (shareInfo == undefined) {
        conn.responseWith(
            makeRPCError(method.id, new InvalidDocPathError(params.docPath)),
        );
        return;
    }
    const result: ShareGetInfoResult = {
        desc: {
            basePath: shareInfo.basePath,
            write: shareInfo.write,
            expired: shareInfo.expired,
        },
        token: shareInfo.shareToken,
    };
    conn.responseWith(makeRPCResult(method.id, result));
}

export async function handleShareMethod(
    conn: Participant,
    method: ShareMethod,
): Promise<void> {
    const m = method.method;
    switch (m) {
        case "share.doc":
            await handleShareDocMethod(conn, method as ShareDocMethod);
            break;
        case "share.info":
            handleShareGetInfo(conn, method as ShareGetInfoMethod);
            break;
        default: {
            const _exhaustiveCheck: never = m;
        }
    }
}

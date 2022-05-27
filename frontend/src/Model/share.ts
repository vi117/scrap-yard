import {
    ShareDocMethod,
    ShareDocResult,
    ShareGetInfoMethod,
    ShareGetInfoResult,
} from "model";
import { RPCErrorWrapper } from "./RPCError";
import { IRPCMessageManager } from "./RPCManager";

/**
 * create or modify shared document
 * @param manager manager of RPC
 * @param params params of method
 * @returns docPath
 * @example
 * ```ts
 * const res = await shareDoc(manager, {
 *    docPath: "test.md",
 *    write: true,
 *    expired: Date.now() + 1000* 3600 * 24* 14,
 * });
 * console.log(res); // { docPath: "test.md", token: "..." }
 * ```
 */
export async function shareDoc(
    manager: IRPCMessageManager,
    params: ShareDocMethod["params"],
) {
    const res = await manager.invokeMethod({
        method: "share.doc",
        params,
    });
    if (res.result) {
        const result = res.result as ShareDocResult;
        return result;
    } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        throw new RPCErrorWrapper(res.error!);
    }
}
/**
 * get info of shared document
 * @param manager manager of RPC
 * @param params params of method
 * @returns info
 * @throws RPCError wrapper of InvalidDocPathError or PermissionDeniedError
 * @example
 * ```ts
 * const info = await getShareInfo(manager, {
 *    docPath: "share/test.md",
 * });
 * console.log(info); // { token: "token", desc: { basePath: "share", write: false, expired: ... } }
 * ```
 */
export async function shareGetInfo(
    manager: IRPCMessageManager,
    params: ShareGetInfoMethod["params"],
) {
    const res = await manager.invokeMethod({
        method: "share.info",
        params,
    });
    if (res.result) {
        const result = res.result as ShareGetInfoResult;
        return result;
    } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        throw new RPCErrorWrapper(res.error!);
    }
}

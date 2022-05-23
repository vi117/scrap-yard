import { ShareDocDescription, ShareDocMethod, ShareDocResult } from "model";
import { RPCErrorWrapper } from "./RPCError";
import { RPCMessageManager } from "./RPCManager";

/**
 * create or modify shared document
 * @param manager manager of RPC
 * @param params params of method
 * @returns docPath
 */
export async function shareDoc(
  manager: RPCMessageManager,
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

export async function shareGetInfo(
  manager: RPCMessageManager,
  params: ShareDocMethod["params"],
) {
  const res = await manager.invokeMethod({
    method: "share.info",
    params,
  });
  if (res.result) {
    const result = res.result as ShareDocDescription;
    return result;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    throw new RPCErrorWrapper(res.error!);
  }
}

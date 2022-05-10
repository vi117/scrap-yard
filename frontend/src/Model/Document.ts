import { DocumentCloseResult, DocumentOpenResult } from "model";
import { RPCErrorWrapper } from "./RPCError";
import { RPCMessageManager } from "./RPCManager";

/**
 * open document
 * @param manager manager of RPC
 * @param filePath path of document
 * @returns document
 */
export async function openDocument(manager: RPCMessageManager, filePath: string) {
  const res = await manager.invokeMethod({
    ...manager.genHeader(),
    method: "document.open",
    params: {
      docPath: filePath,
    },
  });
  if (res.result) {
    const doc = res.result as DocumentOpenResult;
    return doc.doc;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    throw new RPCErrorWrapper(res.error!);
  }
}
/**
 * close document
 * @param manager manager of RPC
 * @param docPath path of document
 * @returns path of document
 */
export async function closeDocument(manager: RPCMessageManager, docPath: string) {
  const res = await manager.invokeMethod({
    ...manager.genHeader(),
    method: "document.close",
    params: {
      docPath,
    },
  });
  if (res.result) {
    const doc = res.result as DocumentCloseResult;
    return doc.docPath;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    throw new RPCErrorWrapper(res.error!);
  }
}

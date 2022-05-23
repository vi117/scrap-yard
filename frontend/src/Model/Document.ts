import { DocumentCloseResult, DocumentOpenResult, DocumentTagGetResult, DocumentTagSetResult } from "model";
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
/**
 * get tags of document
 * @param manager manager of RPC
 * @param docPath path of document
 * @returns tags and updatedAt
 */
export async function getDocumentTags(manager: RPCMessageManager, docPath: string): Promise<DocumentTagGetResult> {
  const res = await manager.invokeMethod({
    method: "document.getTag",
    params: {
      docPath: docPath,
    },
  });
  if (res.result) {
    const result = res.result as DocumentTagGetResult;
    return result;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    throw new RPCErrorWrapper(res.error!);
  }
}
/**
 * set tags of document
 * @param manager
 * @param tags
 * @returns tags
 */
export async function setDocumentTags(
  manager: RPCMessageManager,
  docPath: string,
  tags: string[],
  updatedAt: number,
): Promise<DocumentTagSetResult> {
  const res = await manager.invokeMethod({
    method: "document.setTag",
    params: {
      docPath: docPath,
      tags: tags,
      updatedAt: updatedAt,
    },
  });
  if (res.result) {
    const result = res.result as DocumentTagSetResult;
    return result;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    throw new RPCErrorWrapper(res.error!);
  }
}

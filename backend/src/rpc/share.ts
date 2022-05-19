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
import { ShareDocStore } from "../auth/docShare.ts";

export function handleShareDocMethod(
  conn: Participant,
  method: ShareDocMethod,
): void {
  const param = method.params;
  if (!conn.user.canCustom("shareToken", {})) {
    conn.responseWith(
      makeRPCError(method.id, new PermissionDeniedError("shareToken")),
    );
    return;
  }

  const shareInfo = ShareDocStore.get(param.docPath);
  if (shareInfo == undefined) {
    //create share token
    const shareToken = makeSessionId();
    ShareDocStore.set(param.docPath, {
      basePath: param.docPath,
      shareToken,
      expired: param.expired ?? Date.now() + 1000 * 60 * 60 * 24 * 7,
      write: param.write ?? false,
    });
  } else {
    //update share token info
    ShareDocStore.set(param.docPath, {
      basePath: param.docPath,
      shareToken: shareInfo.shareToken,
      expired: param.expired ?? shareInfo.expired,
      write: param.write ?? shareInfo.write,
    });
  }
  const result: ShareDocResult = {
    docPath: param.docPath,
  };
  conn.responseWith(makeRPCResult(method.id, result));
}

export function handleShareGetInfo(
  conn: Participant,
  method: ShareGetInfoMethod,
) {
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
  };
  conn.responseWith(makeRPCResult(method.id, result));
}

export function handleShareMethod(
  conn: Participant,
  method: ShareMethod,
): void {
  const m = method.method;
  switch (m) {
    case "share.doc":
      handleShareDocMethod(conn, method as ShareDocMethod);
      break;
    case "share.info":
      handleShareGetInfo(conn, method as ShareGetInfoMethod);
      break;
    default: {
      const _exhaustiveCheck: never = m;
    }
  }
}

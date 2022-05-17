import { JsonRPCMethodHeader, JsonRPCNotificationHeader } from "./rpc.ts";

export type ShareDocDescription = {
  basePath: string;
  write: boolean;
  /**
   * expire time:
   * if you want to revoke the share, set this value to `0`
   * if you want to share the document forever, set this value to `Infinity`
   */
  expired: number;
};

export interface ShareDocMethod extends JsonRPCMethodHeader {
  method: "share.doc";
  /**
   * if shareToken set, modify `shareDocDescription`
   */
  params:
    | ShareDocDescription
    | ({ shareToken: string } & Partial<ShareDocDescription>);
}

export interface ShareDocResult {
  shareToken: string;
}

export interface ShareGetInfoMethod extends JsonRPCMethodHeader {
  method: "share.info";
  params: {
    shareToken: string;
  } | {
    docPath: string;
  };
}

export interface ShareGetInfoResult {
  desc: ShareDocDescription;
}

export interface ShareNotification extends JsonRPCNotificationHeader {
  method: "share.docUpdate";
  shareToken: string;
  desc: ShareDocDescription;
}

export type ShareMethod =
  | ShareDocMethod
  | ShareGetInfoMethod;

export type ShareMethodKind = ShareMethod["method"];

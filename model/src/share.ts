import { JsonRPCMethod, JsonRPCMethodHeader } from "./rpc.ts";

export type ShareDocDescription = {
  basePath: string;
  write: boolean;
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

export type ShareMethod =
  | ShareDocMethod
  | ShareGetInfoMethod;

export type ShareMethodKind = ShareMethod["method"];

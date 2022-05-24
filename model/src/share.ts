import { JsonRPCMethodHeader, JsonRPCNotificationHeader } from "./rpc.ts";

export type ShareDocDescription = {
    /**
     * The path of document.
     */
    basePath: string;
    /**
     * writable or readonly
     * @default false
     */
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
    params: ({ docPath: string } & Partial<ShareDocDescription>);
}

export interface ShareDocResult {
    docPath: string;
}

export interface ShareGetInfoMethod extends JsonRPCMethodHeader {
    method: "share.info";
    params: {
        docPath: string;
    };
}

export interface ShareGetInfoResult {
    desc: ShareDocDescription;
}

export interface ShareNotification extends JsonRPCNotificationHeader {
    method: "share.docUpdate";
    params: {
        docPath: string;
        desc: ShareDocDescription;
    };
}

export type ShareMethod =
    | ShareDocMethod
    | ShareGetInfoMethod;

export type ShareMethodResult = ShareDocResult | ShareGetInfoResult;

export type ShareMethodKind = ShareMethod["method"];

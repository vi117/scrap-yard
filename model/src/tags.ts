import { JsonRPCMethodHeader, JsonRPCNotificationHeader } from "./rpc.ts";

export interface DocumentTagGetMethod extends JsonRPCMethodHeader {
  method: "document.getTag";
  params: {
    docPath: string;
  };
}

export interface DocumentTagGetResult {
  tags: string[];
  updatedAt: number;
}

export interface DocumentTagNotification extends JsonRPCNotificationHeader {
  method: "document.tags";
  params: {
    docPath: string;
    tags: string[];
    updatedAt: number;
  };
}

export interface DocumentTagSetMethod extends JsonRPCMethodHeader {
  method: "document.setTag";
  params: {
    docPath: string;
    tags: string[];
    updatedAt: number;
  };
}

export interface DocumentTagSetResult {
  tags: string[];
  updatedAt: number;
}

export interface DocumentTagSetResult {
  updatedAt: number;
}

export type DocumentTagMethodResult =
  | DocumentTagGetResult
  | DocumentTagSetResult;

export type DocumentTagMethod = DocumentTagGetMethod | DocumentTagSetMethod;

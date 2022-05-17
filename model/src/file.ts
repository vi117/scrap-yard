import { JsonRPCNotificationHeader } from "./rpc.ts";

export type FileNotifyEventType = "create" | "modify" | "remove";

export interface FileNotification extends JsonRPCNotificationHeader {
  method: "file.update";
  params: {
    /**
     * paths of the file
     */
    paths: string[];
    /**
     * type of the event
     */
    eventType: FileNotifyEventType;
  };
}

import { RPCMethod, RPCNotification, RPCResponse } from "model";
import { getServerInfoInstance } from "./serverInfo";

type RPCCallback = {
  resolve: (v: RPCResponse) => void;
  reject: (e: Error) => void;
};

const NotificationEventName = "notification";
type RPCMessageManagerEventType = "notification";

export class RPCNotificationEvent extends MessageEvent<RPCNotification> {
  constructor(public readonly notification: RPCNotification, eventInit?: MessageEventInit<RPCNotification>) {
    super(NotificationEventName, {
      data: notification,
      ...eventInit,
    });
  }
}

type RPCMessageBody = Omit<RPCMethod, "id" | "jsonrpc">;

type RPCMessageMessagerEventListener = (this: IRPCMessageManager, e: RPCNotificationEvent) => void;

export interface IRPCMessageManager extends EventTarget {
  readonly opened: boolean;
  close(): void;
  sendNotification(notification: RPCNotification): void;
  addEventListener(name: RPCMessageManagerEventType, listener: RPCMessageMessagerEventListener): void;
  addEventListener(
    name: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(name: RPCMessageManagerEventType, listener: RPCMessageMessagerEventListener): void;
  removeEventListener(
    name: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void;
  invokeMethod(m: RPCMessageBody): Promise<RPCResponse>;
}

export class RPCMessageManager extends EventTarget implements IRPCMessageManager {
  private callbackList: Map<number, RPCCallback>;
  private curId: number;
  private ws?: WebSocket;
  constructor() {
    super();
    this.curId = 1;
    this.callbackList = new Map();
  }

  get opened() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  get openedURL(): string | undefined {
    return this.ws?.url;
  }

  open(url: string | URL, protocals?: string | string) {
    return new Promise<void>((resolve, reject) => {
      console.log("connect to", url);
      this.ws = new WebSocket(url, protocals);
      this.ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        // TODO(vi117): check validation
        if ("id" in data) {
          const response = data as RPCResponse;
          const callback = this.callbackList.get(response.id);
          if (callback) {
            callback.resolve(response);
          }
        } else {
          this.dispatchEvent(new RPCNotificationEvent(data as RPCNotification));
        }
      };
      this.ws.onopen = () => {
        resolve();
      };
      this.ws.onerror = () => {
        reject(new Error("connection error"));
      };
    });
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
    this.callbackList.clear();
  }

  // TODO(vi117): extract id generator
  private genId() {
    const ret = this.curId;
    this.curId++;
    return ret;
  }
  /**
   * helper function to invoke method
   * @returns header of method
   */
  genHeader(): { jsonrpc: "2.0"; id: number } {
    return {
      jsonrpc: "2.0",
      id: this.genId(),
    };
  }

  send(message: RPCMethod): Promise<RPCResponse> {
    if (!this.ws) {
      throw new Error("not connected");
    }
    this.ws.send(JSON.stringify(message));
    const ret = new Promise<RPCResponse>((resolve, reject) => {
      this.callbackList.set(message.id, { resolve, reject });
    });
    return ret;
  }
  sendNotification(message: RPCNotification) {
    if (!this.ws) {
      throw new Error("not connected");
    }
    this.ws.send(JSON.stringify(message));
  }

  addEventListener(
    type: RPCMessageManagerEventType,
    callback: RPCMessageMessagerEventListener | EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type, callback as EventListener, options);
  }
  removeEventListener(
    type: RPCMessageManagerEventType,
    callback: RPCMessageMessagerEventListener | EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void {
    super.removeEventListener(type, callback as EventListener, options);
  }

  async invokeMethod(m: RPCMessageBody): Promise<RPCResponse> {
    const message = {
      ...this.genHeader(),
      method: m.method,
      params: m.params,
    } as RPCMethod;
    return await this.send(message);
  }
}

const RPCManager = new RPCMessageManager();
let RPCManagerLock: null | Promise<void> = null;

export async function getOpenedManagerInstance(): Promise<IRPCMessageManager> {
  if (!RPCManager.opened) {
    if (RPCManagerLock !== null) {
      await RPCManagerLock;
    } else {
      RPCManagerLock = (async () => {
        const info = await getServerInfoInstance();
        const url = new URL(`ws://${info.host}:${info.port}/ws`);
        await RPCManager.open(url);
      })();
      await RPCManagerLock;
    }
  }
  return RPCManager;
}

// for debugging
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).getOpenedManagerInstance = getOpenedManagerInstance;

import { RPCMethod, RPCNotification, RPCResponse } from "model/dist/mod";

type RPCCallback = {
  resolve: (v: RPCResponse) => void;
  reject: (e: Error) => void;
};

const NotificationEventName = "notification";
type RPCMessageManagerEventType = "notification";

export class RPCNotificationEvent extends Event {
  constructor(public readonly notification: RPCNotification, eventInit?: EventInit) {
    super(NotificationEventName, eventInit);
  }
}

type RPCMessageMessagerEventListener = (e: RPCNotificationEvent) => void;
export class RPCMessageManager extends EventTarget {
  close() {
    if (this.ws) {
      this.ws.close();
    }
    this.callbackList.clear();
  }
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
  async open(url: string | URL, protocals?: string | string) {
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
      this.ws.onerror = (e) => {
        reject(new Error("connection error"));
      };
    });
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

  async invokeMethod(m: Omit<RPCMethod, "id" | "jsonrpc">): Promise<RPCResponse> {
    const message = {
      ...this.genHeader(),
      method: m.method,
      params: m.params,
    } as RPCMethod;
    return await this.send(message);
  }
}

export const RPCManager = new RPCMessageManager();

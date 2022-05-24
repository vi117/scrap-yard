import { createAdminUser } from "../auth/user.ts";
import { IUser } from "../auth/user.ts";
import { Participant } from "./connection.ts";
import { RPCNotification, RPCResponse } from "model";

export class MockUser implements Participant {
    messageBuffer: string[];
    user: IUser;
    constructor(public id: string) {
        this.messageBuffer = [];
        this.user = createAdminUser(this.id);
    }
    send(s: string) {
        this.messageBuffer.push(s);
    }
    close() {}
    addEventListener() {}
    removeEventListener() {}
    sendNotification(notification: RPCNotification): void {
        this.send(JSON.stringify(notification));
    }
    responseWith(data: RPCResponse): void {
        const json = JSON.stringify(data);
        this.send(json);
    }
    /**
     * pop message from message buffer
     * @returns message object parsed from string
     * @throws Error if no message
     */
    popObject() {
        const ret = this.messageBuffer.shift();
        if (ret === undefined) {
            throw new Error("no message");
        }
        return JSON.parse(ret);
    }
}

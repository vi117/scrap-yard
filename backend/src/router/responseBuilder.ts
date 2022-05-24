import { Status, STATUS_TEXT } from "std/http";

export class ResponseBuilder {
    status: Status;
    headers: Record<string, string>;
    body?: BodyInit;

    constructor() {
        this.status = 200;
        this.headers = {};
    }
    setStatus(status: Status) {
        this.status = status;
        return this;
    }
    setHeader(key: string, value: string) {
        this.headers[key] = value;
        return this;
    }
    setBody(body: BodyInit) {
        this.body = body;
        return this;
    }
    redirect(location: string) {
        this.setStatus(Status.PermanentRedirect)
            .setHeader("Location", location);
        return this;
    }
    build(): Response {
        return new Response(this.body, {
            status: this.status,
            statusText: STATUS_TEXT.get(this.status),
            headers: this.headers,
        });
    }
}
export function makeResponse(status: Status, body: BodyInit): Response {
    return new ResponseBuilder()
        .setStatus(status)
        .setBody(body)
        .build();
}
export function makeResponseBuilder(): ResponseBuilder {
    return new ResponseBuilder();
}

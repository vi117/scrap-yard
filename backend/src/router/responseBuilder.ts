import { Status, STATUS_TEXT } from "std/http";

export class ResponseBuilder {
    status: Status;
    headers: Headers;
    body?: BodyInit;
    #response!: Response;
    #resolved = false;

    constructor(body?: BodyInit) {
        this.status = 200;
        this.headers = new Headers();
        this.body = body;
    }

    get resolved() {
        return this.#resolved;
    }

    setStatus(status: Status) {
        this.status = status;
        return this;
    }
    setHeader(key: string, value: string) {
        this.headers.set(key, value);
        return this;
    }
    setHeaders(headers: Record<string, string>) {
        for (const [key, value] of Object.entries(headers)) {
            this.headers.set(key, value);
        }
        return this;
    }
    setBody(body: BodyInit) {
        this.body = body;
        return this;
    }
    setResponse(response: Response, resolved = false) {
        if (this.#resolved) {
            throw new Error("Response already resolved");
        }
        if (resolved) {
            this.#resolved = true;
            this.#response = response;
        } else {
            this.status = response.status;
            for (const [key, value] of response.headers.entries()) {
                this.headers.set(key, value);
            }
            this.body = response.body ?? undefined;
        }
        return this;
    }
    setCors(origin: string, credentials: boolean) {
        this.setHeader("Access-Control-Allow-Origin", origin);
        this.setHeader("Access-Control-Allow-Headers", "*");
        this.setHeader("Access-Control-Allow-Methods", "*");
        this.setHeader("Access-Control-Allow-Credentials", `${credentials}`);
        return this;
    }
    setContentType(contentType: string) {
        this.setHeader("Content-Type", contentType);
        return this;
    }
    setJson(json: unknown) {
        this.setContentType("application/json");
        this.setBody(JSON.stringify(json));
        return this;
    }
    redirect(location: string) {
        this.setStatus(Status.PermanentRedirect)
            .setHeader("Location", location);
        return this;
    }
    build(): Response {
        if (this.#resolved) {
            return this.#response;
        } else {
            return new Response(this.body, {
                status: this.status,
                statusText: STATUS_TEXT.get(this.status),
                headers: this.headers,
            });
        }
    }
}

export function makeResponseBuilder(): ResponseBuilder {
    return new ResponseBuilder();
}

import { Handler } from "./handler.ts";
import { makeResponse, Status } from "./util.ts";

type MethodHandler = Record<string, Handler>;

export class MethodHandlerBuilber {
    handlers: MethodHandler;

    constructor() {
        this.handlers = {};
    }

    get(handler: Handler) {
        this.handlers.get = handler;
        return this;
    }

    post(handler: Handler) {
        this.handlers.post = handler;
        return this;
    }

    put(handler: Handler) {
        this.handlers.put = handler;
        return this;
    }

    delete(handler: Handler) {
        this.handlers.delete = handler;
        return this;
    }

    build(): Handler {
        return (req, ctx) => {
            const method = req.method.toLowerCase();
            if (method === "options") {
                return makeResponse(Status.OK, "", {
                    "Allows": Object.keys(this.handlers).join(","),
                    "Access-Control-Allow-Methods": req.headers.get(
                        "Access-Control-Request-Method",
                    )!,
                    "Access-Control-Allow-Headers": req.headers.get(
                        "Access-Control-Request-Headers",
                    )!,
                    "Access-Control-Allow-Origin": req.headers.get(
                        "Origin",
                    )!,
                });
            }
            const fn = this.handlers[method];
            if (fn) {
                return fn(req, ctx);
            }
            return makeResponse(Status.MethodNotAllowed);
        };
    }
}

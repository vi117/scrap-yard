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
        return async (req, ctx) => {
            const method = req.method.toLowerCase();
            const allowedMethod = [...Object.keys(this.handlers), "options"];
            if (method === "options") {
                return makeResponse(Status.OK, "", {
                    "Allows": allowedMethod.map((x) => x.toUpperCase()).join(
                        ", ",
                    ),
                    "Access-Control-Allow-Headers": req.headers.get(
                        "Access-Control-Request-Headers",
                    )!,
                }).setCorsMethods(allowedMethod);
            }
            const fn = this.handlers[method];
            if (fn) {
                const res = await fn(req, ctx);
                res.setCorsMethods(allowedMethod);
                return res;
            }
            return makeResponse(Status.MethodNotAllowed);
        };
    }
}

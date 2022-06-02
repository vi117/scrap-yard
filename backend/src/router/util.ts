import { Status } from "std/http";
import { ResponseBuilder } from "./responseBuilder.ts";

export function makeResponse(
    code: Status,
    content?: BodyInit,
    headers?: Record<string, string>,
): ResponseBuilder {
    return new ResponseBuilder()
        .setStatus(code)
        .setHeaders(headers ?? {})
        .setBody(content ?? "");
}
export function makeJsonResponse(
    code: Status,
    content?: unknown,
): ResponseBuilder {
    return makeResponse(code, JSON.stringify(content), {
        "content-type": "application/json",
    });
}

export function makeRedirect(location: string): ResponseBuilder {
    return new ResponseBuilder().redirect(location);
}

export function isQueryValueTrue(value: string | undefined | null): boolean {
    return value === "true" || value === "1" || value === "on" ||
        value === "yes" || value === "y" || value === "";
}

export { Status };

import { Status, STATUS_TEXT } from "std/http";

export function makeResponse(
    code: Status,
    content?: BodyInit,
    headers?: HeadersInit,
): Response {
    const text = STATUS_TEXT.get(code);
    return new Response(content ?? text, {
        status: code,
        statusText: text,
        headers: headers,
    });
}
export function makeJsonResponse(code: Status, content?: unknown): Response {
    return makeResponse(code, JSON.stringify(content), {
        "content-type": "application/json",
        "Access-Control-Allow-Origin": "*",
    });
}

export function makeRedirect(location: string): Response {
    return new Response("", {
        status: Status.PermanentRedirect,
        statusText: "Permanent Redirect",
        headers: {
            "Location": location,
        },
    });
}

export function isQueryValueTrue(value: string | undefined | null): boolean {
    return value === "true" || value === "1" || value === "on" ||
        value === "yes" || value === "y" || value === "";
}

export { Status };

import { ResponseBuilder } from "./responseBuilder.ts";

export type Handler = (
    req: Request,
    ctx: Record<string, string>,
) => ResponseBuilder | Promise<ResponseBuilder>;

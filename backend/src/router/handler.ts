export type Handler = (
  req: Request,
  ctx: Record<string, string>,
) => Response | Promise<Response>;

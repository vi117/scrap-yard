import {
  DocumentMethod,
  DocumentOpenResult,
  InvalidDocPathError,
  makeRPCError,
  makeRPCResult,
  PermissionDeniedError,
} from "model";
import { DocStore } from "./docStore.ts";
import { Participant } from "./connection.ts";
import { returnRequest } from "./rpc.ts";

export async function handleDocumentMethod(
  conn: Participant,
  method: DocumentMethod,
): Promise<void> {
  if (!conn.user.permissionSet.canRead(method.params.docPath)) {
    returnRequest(
      conn,
      makeRPCError(method.id, new PermissionDeniedError(method.params.docPath)),
    );
    return;
  }
  switch (method.method) {
    case "document.open":
      {
        try {
          const d = await DocStore.open(conn, method.params.docPath);
          const result: DocumentOpenResult = {
            doc: {
              docPath: d.docPath,
              chunks: d.chunks,
              tags: d.tags,
              updatedAt: d.updatedAt,
              tagsUpdatedAt: d.tagsUpdatedAt,
              seq: d.seq,
            },
          };
          returnRequest(conn, makeRPCResult(method.id, result));
        } catch (e) {
          if (e instanceof Deno.errors.NotFound) {
            returnRequest(
              conn,
              makeRPCError(
                method.id,
                new InvalidDocPathError(method.params.docPath),
              ),
            );
          } else throw e;
        }
      }
      break;
    case "document.close":
      //TODO(vi117): close document
      throw new Error("Not implemented");
  }
}

import {
  DocumentCloseResult,
  DocumentMethod,
  DocumentOpenResult,
  InvalidDocPathError,
  makeRPCError,
  makeRPCResult,
  PermissionDeniedError,
} from "model";
import { DocStore } from "./docStore.ts";
import { Participant } from "./connection.ts";

export async function handleDocumentMethod(
  conn: Participant,
  method: DocumentMethod,
): Promise<void> {
  const docPath = conn.user.joinPath(method.params.docPath);
  if (!conn.user.canRead(docPath)) {
    conn.responseWith(
      makeRPCError(method.id, new PermissionDeniedError(docPath)),
    );
    return;
  }
  const methodKind = method.method;
  switch (methodKind) {
    case "document.open": {
      try {
        const d = await DocStore.open(conn, docPath);
        const result: DocumentOpenResult = {
          doc: {
            ...d,
            docPath: method.params.docPath,
          },
        };
        conn.responseWith(makeRPCResult(method.id, result));
        return;
      } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
          conn.responseWith(
            makeRPCError(
              method.id,
              new InvalidDocPathError(method.params.docPath),
            ),
          );
          return;
        } else throw e;
      }
    }
    case "document.close": {
      await DocStore.close(conn, docPath);
      const result: DocumentCloseResult = {
        docPath: method.params.docPath,
      };
      conn.responseWith(makeRPCResult(method.id, result));
      return;
    }
    default: {
      const _exhaustiveCheck: never = methodKind;
    }
  }
}

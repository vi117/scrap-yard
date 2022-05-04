import {
  DocumentMethod,
  DocumentOpenResult,
  InvalidDocPathError,
  makeRPCError,
  makeRPCResult,
  RPCResponse,
} from "model";
import { DocStore } from "./docStore.ts";
import { Connection } from "./connection.ts";

export async function handleDocumentMethod(
  conInfo: Connection,
  method: DocumentMethod,
): Promise<RPCResponse> {
  switch (method.method) {
    case "document.open": {
      try {
        const d = await DocStore.open(conInfo, method.params.docPath);
        const result: DocumentOpenResult = {
          doc: {
            docPath: d.docPath,
            chunks: d.chunks,
            tags: d.tags,
            updatedAt: d.updatedAt,
          },
        };
        return makeRPCResult(method.id, result);
      } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
          return makeRPCError(
            method.id,
            new InvalidDocPathError(method.params.docPath),
          );
        } else throw e;
      }
    }
    case "document.close":
      throw new Error("Not implemented");
  }
}

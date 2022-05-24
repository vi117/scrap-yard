import {
    DocumentCloseResult,
    DocumentMethod,
    DocumentOpenResult,
    DocumentTagGetResult,
    DocumentTagMethod,
    DocumentTagSetResult,
    InvalidDocPathError,
    makeRPCError,
    makeRPCResult,
    PermissionDeniedError,
    TagsConflictError,
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
                        chunks: d.chunks,
                        updatedAt: d.updatedAt,
                        seq: d.seq,
                        tags: d.tags,
                        tagsUpdatedAt: d.tagsUpdatedAt,
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

export async function handleTagMethod(
    conn: Participant,
    method: DocumentTagMethod,
): Promise<void> {
    const path = conn.user.joinPath(method.params.docPath);
    const methodKind = method.method;
    switch (methodKind) {
        case "document.getTag": {
            if (!conn.user.canRead(path)) {
                conn.responseWith(
                    makeRPCError(method.id, new PermissionDeniedError(path)),
                );
                return;
            }
            const doc = await DocStore.open(conn, path);
            const result: DocumentTagGetResult = {
                tags: doc.tags,
                updatedAt: doc.tagsUpdatedAt,
            };
            conn.responseWith(makeRPCResult(method.id, result));
            return;
        }
        case "document.setTag": {
            if (!conn.user.canWrite(path)) {
                conn.responseWith(
                    makeRPCError(method.id, new PermissionDeniedError(path)),
                );
                return;
            }
            const doc = await DocStore.open(conn, path);
            if (method.params.updatedAt < doc.tagsUpdatedAt) {
                conn.responseWith(
                    makeRPCError(
                        method.id,
                        new TagsConflictError(doc.tags, doc.tagsUpdatedAt),
                    ),
                );
                return;
            }
            doc.setTags(method.params.tags);
            const result: DocumentTagSetResult = {
                updatedAt: doc.tagsUpdatedAt,
            };
            doc.broadcastTagsNotification(conn);
            conn.responseWith(makeRPCResult(method.id, result));
            return;
        }
    }
}

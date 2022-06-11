import {
    ChunkCreateMethod,
    ChunkCreateResult,
    ChunkDeleteMethod,
    ChunkDeleteResult,
    ChunkModifyMethod,
    ChunkModifyResult,
    ChunkMoveMethod,
    ChunkMoveResult,
} from "model";
import { RPCErrorWrapper } from "./RPCError";
import { IRPCMessageManager } from "./RPCManager";

/**
 * create chunk
 * @param manager manager of RPC
 * @param params params of method
 * @returns chunkId created
 * @example
 * ```ts
 * const manager: IRPCMessageManager = Foo.getInstance();
 * const params = {
 *   docPath: "test.md",
 *   position: 0,
 *   chunkId: "It's optional", // optional
 *   chunkContent: {
 *   text: "test",
 *   type: "text"
 *   }
 * }
 * const {chunkId, updatedAt} = await manager.invokeMethod(manager, params);
 * console.log(chunkId); // "It's optional"
 * ```
 */
export async function chunkCreate(
    manager: IRPCMessageManager,
    params: ChunkCreateMethod["params"],
) {
    const res = await manager.invokeMethod({
        method: "chunk.create",
        params,
    });
    if (res.result) {
        const result = res.result as ChunkCreateResult;
        return result;
    } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        throw new RPCErrorWrapper(res.error!);
    }
}

/**
 * delete chunk
 * @param manager manager of RPC
 * @param param params of method
 * @returns chunkId deleted
 * @example
 * ```ts
 * const manager: IRPCMessageManager = Foo.getInstance();
 * const params = {
 *  docPath: "test.md",
 *  chunkId: "some chunk id"
 * }
 * const {chunkId, updatedAt} = await manager.invokeMethod(manager, params);
 * console.log(chunkId); // "some chunk id"
 * ```
 */
export async function chunkDelete(
    manager: IRPCMessageManager,
    params: ChunkDeleteMethod["params"],
) {
    const res = await manager.invokeMethod({
        method: "chunk.delete",
        params,
    });
    if (res.result) {
        const result = res.result as ChunkDeleteResult;
        return result;
    } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        throw new RPCErrorWrapper(res.error!);
    }
}

/**
 * modify chunk
 * @param manager manager of RPC
 * @param params params of method
 * @returns chunkId modified
 * @example
 * ```ts
 * const manager: IRPCMessageManager = Foo.getInstance();
 * const params = {
 *   docPath: "test.md",
 *   chunkId: "some chunk id",
 *   chunkContent: {
 *     text: "test",
 *     type: "text"
 *   }
 * }
 * const {chunkId, updatedAt} = await manager.invokeMethod(manager, params);
 * console.log(chunkId); // "some chunk id"
 * ```
 */
export async function chunkModify(
    manager: IRPCMessageManager,
    params: ChunkModifyMethod["params"],
) {
    const res = await manager.invokeMethod({
        method: "chunk.modify",
        params,
    });
    if (res.result) {
        const result = res.result as ChunkModifyResult;
        return result;
    } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        throw new RPCErrorWrapper(res.error!);
    }
}

/**
 * move chunk
 * @param manager manager of RPC
 * @param params params of method
 * @returns chunkId moved
 * @example
 * ```ts
 * const manager: IRPCMessageManager = Foo.getInstance();
 * const params = {
 *  docPath: "test.md",
 * chunkId: "some chunk id",
 * position: 0
 * }
 * const {chunkId, updatedAt} = await manager.invokeMethod(manager, params);
 * console.log(chunkId); // "some chunk id"
 * ```
 */
export async function chunkMove(
    manager: IRPCMessageManager,
    params: ChunkMoveMethod["params"],
) {
    const res = await manager.invokeMethod({
        method: "chunk.move",
        params,
    });
    if (res.result) {
        const result = res.result as ChunkMoveResult;
        return result;
    } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        throw new RPCErrorWrapper(res.error!);
    }
}

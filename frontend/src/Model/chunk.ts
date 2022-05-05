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
import { RPCMessageManager } from "./RPCManager";

/**
 * create chunk
 * @param manager manager of RPC
 * @param params params of method
 * @returns chunkId created
 * @example
 * ```ts
 * const manager: RPCMessageManager = Foo.getInstance();
 * const params = {
 *   docPath: "test.md",
 *   position: 0,
 *   chunkId: "It's optional", // optional
 *   chunkContent: {
 *   text: "test",
 *   type: "text"
 *   }
 * }
 * const chunkId = await manager.invokeMethod(manager, params);
 * console.log(chunkId); // "It's optional"
 * ```
 */
export async function chunkCreate(manager: RPCMessageManager, params: ChunkCreateMethod["params"]) {
  const method: ChunkCreateMethod = {
    ...manager.genHeader(),
    method: "chunk.create",
    params,
  };
  const res = await manager.send(method);
  if (res.result) {
    const result = res.result as ChunkCreateResult;
    return result.chunkId;
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
 * const manager: RPCMessageManager = Foo.getInstance();
 * const params = {
 *  docPath: "test.md",
 *  chunkId: "some chunk id"
 * }
 * const chunkId = await manager.invokeMethod(manager, params);
 * console.log(chunkId); // "some chunk id"
 */
export async function chunkDelete(manager: RPCMessageManager, params: ChunkDeleteMethod["params"]) {
  const method: ChunkDeleteMethod = {
    ...manager.genHeader(),
    method: "chunk.delete",
    params,
  };
  const res = await manager.send(method);
  if (res.result) {
    const result = res.result as ChunkDeleteResult;
    return result.chunkId;
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
 * const manager: RPCMessageManager = Foo.getInstance();
 * const params = {
 *   docPath: "test.md",
 *   chunkId: "some chunk id",
 *   chunkContent: {
 *     text: "test",
 *     type: "text"
 *   }
 * }
 * const chunkId = await manager.invokeMethod(manager, params);
 * console.log(chunkId); // "some chunk id"
 */
export async function chunkModify(manager: RPCMessageManager, params: ChunkModifyMethod["params"]) {
  const method: ChunkModifyMethod = {
    ...manager.genHeader(),
    method: "chunk.modify",
    params,
  };
  const res = await manager.send(method);
  if (res.result) {
    const result = res.result as ChunkModifyResult;
    return result.chunkId;
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
 * const manager: RPCMessageManager = Foo.getInstance();
 * const params = {
 *  docPath: "test.md",
 * chunkId: "some chunk id",
 * position: 0
 * }
 * const chunkId = await manager.invokeMethod(manager, params);
 * console.log(chunkId); // "some chunk id"
 * ```
 */
export async function chunkMove(manager: RPCMessageManager, params: ChunkMoveMethod["params"]) {
  const method: ChunkMoveMethod = {
    ...manager.genHeader(),
    method: "chunk.move",
    params,
  };
  const res = await manager.send(method);
  if (res.result) {
    const result = res.result as ChunkMoveResult;
    return result.chunkId;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    throw new RPCErrorWrapper(res.error!);
  }
}

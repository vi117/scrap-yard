/**
 * JSON RPC 2.0 Method Header
 * @see https://www.jsonrpc.org/specification#request_object
 */
export interface JsonRPCMethodHeader {
  /**
   * jsonrpc must be "2.0"
   */
  jsonrpc: "2.0";
  /**
   * An identifier established by the client.
   */
  id: number;
}

export function isJsonRPCMethodHeader(
  obj: unknown,
): obj is JsonRPCMethodHeader {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  if ("jsonrpc" in obj && "id" in obj) {
    return (obj as JsonRPCMethodHeader).jsonrpc === "2.0" &&
      typeof (obj as JsonRPCMethodHeader).id === "number";
  }
  return false;
}

export interface JsonRPCMethod extends JsonRPCMethodHeader {
  method: string;
  // deno-lint-ignore no-explicit-any
  params: any;
}

export function isJsonRPCMethod(
  method: JsonRPCMethodHeader,
): method is JsonRPCMethod {
  return "method" in method && "params" in method;
}

/**
 * JSON RPC 2.0 Notification Header
 * @see https://www.jsonrpc.org/specification#notification
 */
export interface JsonRPCNotificationHeader {
  /**
   * jsonrpc must be "2.0"
   */
  jsonrpc: "2.0";
}

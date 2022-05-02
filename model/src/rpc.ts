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

import { RPCError, RPCErrorCode } from "model";

export class RPCErrorWrapper extends Error {
  data?: unknown;
  code: RPCErrorCode;
  constructor(err: RPCError) {
    super(err.message);
    this.code = err.code;
    this.data = err.data;
  }
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
    };
  }
}

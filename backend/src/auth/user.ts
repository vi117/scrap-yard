import { createPermission, IPermissionDescriptor } from "./permission.ts";
import { join as pathJoin, relative } from "std/path";
export interface IUser extends IPermissionDescriptor {
  readonly id: string;
  readonly expiredAt: number;
  readonly basepath: string;

  joinPath(path: string): string;
  relativePath(path: string): string;

  expiredAfter(seconds: number): void;
  isExpired(): boolean;
}

class UserSessionImpl implements IUser {
  id: string;
  expiredAt: number;
  permissionSet: IPermissionDescriptor;
  basepath: string;

  constructor(
    id: string,
    permissionSet: IPermissionDescriptor,
    basepath: string,
  ) {
    this.id = id;
    this.expiredAt = Date.now() + 1000 * 60 * 60 * 24 * 30;
    this.permissionSet = permissionSet;
    this.basepath = basepath;
  }

  joinPath(path: string): string {
    return pathJoin(this.basepath, path);
  }
  relativePath(path: string): string {
    return relative(this.basepath, path);
  }

  expiredAfter(seconds: number): void {
    this.expiredAt = Date.now() + 1000 * seconds;
  }

  isExpired(): boolean {
    return this.expiredAt < Date.now();
  }

  canRead(path: string): boolean {
    return (!this.isExpired()) && this.permissionSet.canRead(path);
  }
  canWrite(path: string): boolean {
    return (!this.isExpired()) && this.permissionSet.canWrite(path);
  }
  // deno-lint-ignore no-explicit-any
  canCustom(path: string, options: any): boolean {
    return (!this.isExpired()) && this.permissionSet.canCustom(path, options);
  }
}

export function createAdminUser(tokenKey: string): IUser {
  return new UserSessionImpl(tokenKey, {
    canRead: (_path) => true,
    canWrite: (_path) => true,
    canCustom: (_path, _options) => true,
  }, "");
}

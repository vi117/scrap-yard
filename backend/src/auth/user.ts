import { createPermission, PermissionDescriptor } from "./permission.ts";

export interface UserSession {
  id: string;
  superuser: boolean;
  expiredAt: number;
  permissionSet: PermissionDescriptor;
}

export function createAdminUser(tokenKey: string): UserSession {
  return {
    id: tokenKey,
    superuser: true,
    expiredAt: new Date().getTime() + 1000 * 60 * 60 * 24 * 30,
    permissionSet: createPermission("", { writable: true }),
  };
}

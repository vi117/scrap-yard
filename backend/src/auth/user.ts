import {
    AdminPermission,
    createPermission,
    IPermissionDescriptor,
} from "./permission.ts";
import { join as pathJoin, relative } from "std/path";
import { registerReconstructor } from "../serializer.ts";
export interface IUser extends IPermissionDescriptor {
    readonly id: string;
    readonly expiredAt: number;
    readonly basepath: string;

    joinPath(path: string): string;
    relativePath(path: string): string;

    setExpired(seconds: number): void;
    isExpired(): boolean;

    // deno-lint-ignore no-explicit-any
    toJSON(): any;
}

type UserSessionImplJSON = {
    __type__: "UserSessionImpl";
    id: string;
    expiredAt: number;
    basepath: string;
    permissionSet: IPermissionDescriptor;
};

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
    toJSON(): UserSessionImplJSON {
        return {
            __type__: "UserSessionImpl",
            id: this.id,
            permissionSet: this.permissionSet,
            expiredAt: this.expiredAt,
            basepath: this.basepath,
        };
    }

    joinPath(path: string): string {
        return pathJoin(this.basepath, path);
    }
    relativePath(path: string): string {
        return relative(this.basepath, path);
    }

    setExpired(seconds: number): void {
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
        return (!this.isExpired()) &&
            this.permissionSet.canCustom(path, options);
    }
}
registerReconstructor("UserSessionImpl", (value: UserSessionImplJSON) => {
    const ret = new UserSessionImpl(
        value.id,
        value.permissionSet,
        value.basepath,
    );
    ret.expiredAt = value.expiredAt;
    return ret;
});

export function createAdminUser(tokenKey: string): IUser {
    return new UserSessionImpl(tokenKey, new AdminPermission(), "");
}

export type createUserOptions = {
    basepath: string;
    write: boolean;
    expiredAt: number;
};

export function createUser(
    tokenKey: string,
    options: createUserOptions,
): IUser {
    const { basepath, write, expiredAt } = options;
    const ret = new UserSessionImpl(
        tokenKey,
        createPermission(basepath, {
            writable: write,
        }),
        basepath,
    );
    ret.setExpired(expiredAt);
    return ret;
}

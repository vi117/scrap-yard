import { normalize as normalizePath, relative } from "std/path";
import { registerReconstructor } from "../serializer.ts";

export interface IPermissionDescriptor {
    /**
     * ability to read the document
     * @param path the path to check (relative to the user root)
     */
    canRead(path: string): boolean;
    /**
     * ability to write the document
     * @param path the path to check (relative to the user root)
     */
    canWrite(path: string): boolean;

    /**
     * ability of custom operation
     */
    // deno-lint-ignore no-explicit-any
    canCustom(path: string, options: any): boolean;

    // deno-lint-ignore no-explicit-any
    toJSON(): any;
}

type createPermissionOption = {
    writable?: boolean;
};

export class AdminPermission implements IPermissionDescriptor {
    canRead(): boolean {
        return true;
    }
    canWrite(): boolean {
        return true;
    }
    canCustom(): boolean {
        return true;
    }
    toJSON() {
        return {
            __type__: "AdminPermission",
        };
    }
}
registerReconstructor("AdminPermission", () => new AdminPermission());

class PermissionImpl implements IPermissionDescriptor {
    basePath: string;
    writable: boolean;
    constructor(basePath: string, options?: createPermissionOption) {
        basePath = normalizePath(basePath);
        if (basePath.endsWith("/")) {
            basePath = basePath.substring(0, basePath.length - 1);
        }
        this.basePath = basePath;
        this.writable = options?.writable ?? false;
    }
    toJSON() {
        return {
            __type__: "PermissionImpl",
            basePath: this.basePath,
            writable: this.writable,
        };
    }

    canRead(path: string): boolean {
        path = normalizePath(path);
        const rel = relative(this.basePath, path);
        return !(rel.startsWith(".."));
    }

    canWrite(path: string): boolean {
        if (this.writable) {
            return this.canRead(path);
        }
        return false;
    }

    // deno-lint-ignore no-explicit-any
    canCustom(_path: string, _options: any): boolean {
        return false;
    }
}
// deno-lint-ignore no-explicit-any
registerReconstructor("PermissionImpl", (value: any) => {
    return new PermissionImpl(value.basePath, { writable: value.writable });
});

export function createPermission(
    basePath: string,
    options?: createPermissionOption,
): IPermissionDescriptor {
    //TODO(vi117): permission abs path is not correct
    return new PermissionImpl(basePath, options);
}

import { normalize as normalizePath } from "std/path";

export interface PermissionDescriptor {
  /**
   * ability to read the document
   * @param path the path to check
   */
  canRead(path: string): boolean;
  /**
   * ability to write the document
   * @param path the path to check
   */
  canWrite(path: string): boolean;

  /**
   * ability of custom operation
   */
  // deno-lint-ignore no-explicit-any
  canCustom(path: string, options: any): boolean;
}

type createPermissionOption = {
  writable?: boolean;
};

class PermissionImpl implements PermissionDescriptor {
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

  canRead(path: string): boolean {
    path = normalizePath(path);
    if (path.startsWith(this.basePath)) {
      return true;
    }
    return false;
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

export function createPermission(
  basePath: string,
  options?: createPermissionOption,
): PermissionDescriptor {
  return new PermissionImpl(basePath, options);
}

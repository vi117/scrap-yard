const reg = /([\\/]\.[^\\/.])|(^\.[^\\/.])/;
/**
 * is hidden file or dir
 * @param path file path
 * @returns true if hidden file or dir
 */
export function isHidden(path: string): boolean {
    return reg.test(path);
}

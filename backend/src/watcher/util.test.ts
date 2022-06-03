import { assertEquals } from "std/assert";
import { isHidden } from "./util.ts";

const testcase: [string, boolean][] = [
    ["foo.ts", false],
    ["foo/bar.ts", false],
    ["foo/bar/baz.ts", false],
    ["foo/bar/baz/qux.ts", false],
    ["test.ts", false],
    ["test/foo.ts", false],
    ["test/.foo/bar.ts", true],
    ["test/foo/bar.ts", false],
    ["test/foo/.bar.ts", true],
    [".deno_dir/foo.ts", true],
    [".deno_dir/foo/bar.ts", true],
    [".ignore", true],
    [".ignore.txt", true],
    [".gitignore", true],
    [".한글", true],
    ["한글.txt", false],
    ["그냥 이름", false],
    ["./foo.ts", false],
    ["./foo/bar.ts", false],
    ["./foo/bar/.baz.ts", true],
    ["\\foo.ts", false],
    ["\\foo\\bar.ts", false],
    ["\\.fff", true],
    ["sdf\\.fff\\", true],
    ["./././aaa.ts", false],
    ["../../aaa.ts", false],
];

Deno.test({
    name: "watcher util isHidden",
    fn: () => {
        for (const [path, result] of testcase) {
            assertEquals(
                isHidden(path),
                result,
                `isHidden(${path}) must be ${result}`,
            );
        }
    },
});

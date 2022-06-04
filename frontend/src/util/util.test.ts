import { expect, it } from "vitest";
import { isRelative } from "./util";

it("isRelative", () => {
    expect(isRelative(".")).toBe(true);
    expect(isRelative("..")).toBe(true);
    expect(isRelative("/")).toBe(false);
    expect(isRelative("/a")).toBe(false);
});

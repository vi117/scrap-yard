import "@testing-library/jest-dom";
import { vi } from "vitest";
import { getServerInfoInstance } from "./serverInfo";

afterEach(() => {
    vi.restoreAllMocks();
});

test("getServerInfoInstance", async () => {
    const mock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
            "name": "scrap-yard-server",
            "version": "0.0.1",
            "description": "A simple server",
            "host": "localhost",
            "port": "8000",
            "allowAnonymous": true,
        }),
    });
    vi.stubGlobal("fetch", mock);
    const info = await getServerInfoInstance();
    expect(info.name).toBe("scrap-yard-server");
    expect(info.version).toBe("0.0.1");
    expect(mock).toBeCalled();
});

import { getServerInfoInstance } from "./serverInfo";

test("getServerInfoInstance", async () => {
    const info = await getServerInfoInstance();
    expect(info.name).toBe("scrap-yard-server");
});

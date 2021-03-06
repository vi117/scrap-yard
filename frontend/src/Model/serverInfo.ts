const endpoint = "info";

export type ServerInfo = {
    name: string;
    description: string;
    host: string;
    port: number;
    allowAnonymous: boolean;
    version: string;
};

/**
 * fetch server info
 * @param host hostname or ip address
 * @param port port number
 * @returns ServerInfo
 */
export async function fetchServerInfo(
    host: string,
    port: number,
): Promise<ServerInfo> {
    let url = "";
    if (port === 443) {
        url = `https://${host}/${endpoint}`;
    } else if (port === 80) {
        url = `http://${host}/${endpoint}`;
    } else {
        url = `http://${host}:${port}/${endpoint}`;
    }
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(res.statusText);
    }
    const info = await res.json();
    return info;
}

let infoInstance: ServerInfo | null = null;
/**
 * get server info cached
 * @returns ServerInfo
 * @throws Error if not found
 * @example
 * ```ts
 * const info = await getServerInfoInstance();
 * console.log(info.name); // "scrap-yard-server"
 * ```
 */
export async function getServerInfoInstance(): Promise<ServerInfo> {
    if (infoInstance === null) {
        infoInstance = await fetchServerInfo(
            window.location.hostname,
            parseInt(window.location.port),
        );
    }
    return infoInstance;
}

/**
 * get server info cached
 * @returns ServerInfo
 * @throws Error if not found or not loaded
 * @example
 * ```ts
 * const info = getServerInfo();
 * console.log(info.name); // "scrap-yard-server"
 * ```
 */
export function getServerInfo() {
    if (infoInstance === null) {
        throw new Error("not loaded");
    }
    return infoInstance;
}

export function makeEndpointURL(path: string) {
    const info = getServerInfo();
    const url = new URL(path, `http://${info.host}:${info.port}`);
    return url;
}

// for debug
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).getServerInfoInstance = getServerInfoInstance;

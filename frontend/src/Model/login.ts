import { makeEndpointURL } from "./serverInfo";

/**
 * login to server with token
 * @param token token of user
 * @returns void
 * @throws Error if not found.
 */
export async function loginWithToken(token: string): Promise<void> {
    const url = await makeEndpointURL("/auth/login/");
    const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ token }),
    });
    if (!res.ok) {
        const reason = (await res.json()).reason;
        throw new Error(res.statusText + ": " + reason);
    }
}

/**
 * login to server with password.
 * admin user only.
 * @param password password of user
 */
export async function loginWithPassword(password: string): Promise<void> {
    const url = await makeEndpointURL("/auth/login");
    const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ password }),
    });
    if (!res.ok) {
        const reason = (await res.json()).reason;
        throw new Error(res.statusText + ": " + reason);
    }
}

/**
 * logout from server
 * @returns void
 * @throws Error if not login
 */
export async function logout(): Promise<void> {
    const url = await makeEndpointURL("/auth/logout");
    const res = await fetch(url, {
        method: "POST",
        credentials: "include",
    });
    if (!res.ok) {
        const reason = (await res.json()).reason;
        throw new Error(res.statusText + ": " + reason);
    }
}

(window as any).loginWithPassword = loginWithPassword;
(window as any).loginWithToken = loginWithToken;
(window as any).logout = logout;

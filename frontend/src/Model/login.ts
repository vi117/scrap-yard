import { makeEndpointURL } from "./serverInfo";

export function loginType(): string {
    return sessionStorage.getItem("logintype") ?? "logout";
}

/**
 * login to server with token
 * @param token token of user
 * @returns void
 * @throws Error if not found.
 */
export async function loginWithToken(token: string): Promise<void> {
    const url = await makeEndpointURL("/auth/login/");
    const res = await fetch(url.href, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ token }),
    });
    if (!res.ok) {
        const reason = (await res.json()).reason;
        throw new Error(res.statusText + ": " + reason);
    }

    sessionStorage.setItem("logintype", "token");
}

/**
 * login to server with password.
 * admin user only.
 * @param password password of user
 */
export async function loginWithPassword(password: string): Promise<void> {
    const url = await makeEndpointURL("/auth/login");
    const res = await fetch(url.href, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ password }),
    });
    if (!res.ok) {
        const reason = (await res.json()).reason;
        throw new Error(res.statusText + ": " + reason);
    }

    sessionStorage.setItem("logintype", "pass");
}

/**
 * logout from server
 * @returns void
 * @throws Error if not login
 */
export async function logout(): Promise<void> {
    const url = await makeEndpointURL("/auth/logout");
    const res = await fetch(url.href, {
        method: "POST",
        credentials: "include",
    });
    if (!res.ok) {
        const reason = (await res.json()).reason;
        throw new Error(res.statusText + ": " + reason);
    }

    sessionStorage.removeItem("logintype");
}

export type LoginInfo = {
    login: false;
} | {
    login: true;
    expiredAt: number;
};

/**
 * get login info
 * @returns login info
 */
export async function getLoginInfo(): Promise<LoginInfo> {
    const url = await makeEndpointURL("/auth/info");
    const res = await fetch(url.href);
    if (!res.ok) {
        // propably server goes down
        throw new Error(res.statusText);
    }
    const json = await res.json();
    return json as LoginInfo;
}

(window as any).loginWithPassword = loginWithPassword;
(window as any).loginWithToken = loginWithToken;
(window as any).logout = logout;

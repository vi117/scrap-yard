export interface UserSession {
  id: string;
  superuser: boolean;
  expiredAt: number;
}

export function createAdminUser(tokenKey: string): UserSession {
  return {
    id: tokenKey,
    superuser: true,
    expiredAt: new Date().getTime() + 1000 * 60 * 60 * 24 * 30,
  };
}

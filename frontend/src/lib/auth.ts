export type Tokens = { accessToken: string; refreshToken: string };

export function saveTokens(tokens: Tokens, remember: boolean) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem('accessToken', tokens.accessToken);
  storage.setItem('refreshToken', tokens.refreshToken);
}

export function getAccessToken(): string | null {
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
}

export function decodeJwt<T = any>(token: string): T | null {
  try {
    const [, payload] = token.split('.');
    const base = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base + '='.repeat((4 - (base.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function routeForRoles(roles?: string[] | null): string {
  if (!roles || roles.length === 0) return '/user';
  if (roles.includes('admin')) return '/admin';
  return '/user';
}

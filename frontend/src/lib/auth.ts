import { API_BASE } from './config';
// In-memory access token (not persisted across reloads)
let accessTokenMemory: string | null = null;

export function saveAccessToken(token: string, _remember: boolean) {
  // Security-first: keep access token in memory only. Do not persist in web storage.
  accessTokenMemory = token;
  try { sessionStorage.removeItem('accessToken'); } catch {}
}

export function getAccessToken(): string | null {
  // Memory-only; after reload, AuthGate will perform a silent refresh using HttpOnly rt cookie
  return accessTokenMemory;
}

export function clearTokens() {
  accessTokenMemory = null;
  try { localStorage.removeItem('accessToken'); } catch {}
  try { localStorage.removeItem('refreshToken'); } catch {}
  sessionStorage.removeItem('accessToken');
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

export async function attemptRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken?: string };
    if (data?.accessToken) {
      saveAccessToken(data.accessToken, false);
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

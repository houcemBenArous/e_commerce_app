import { API_BASE } from './config';
// In-memory access token (not persisted across reloads)
let accessTokenMemory: string | null = null;

export function saveAccessToken(token: string, remember: boolean) {
  accessTokenMemory = token;
  // Optionally keep across reloads using sessionStorage (no refresh token stored in JS)
  if (remember) {
    sessionStorage.setItem('accessToken', token);
  } else {
    sessionStorage.removeItem('accessToken');
  }
}

export function getAccessToken(): string | null {
  if (accessTokenMemory) return accessTokenMemory;
  const s = sessionStorage.getItem('accessToken');
  if (s) accessTokenMemory = s;
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

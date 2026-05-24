import type { User } from './types';

const AUTH_STORAGE_KEY = 'mura-web-user';
const TOKEN_STORAGE_KEY = 'mura-web-token';

export function getAuthToken(): string | null {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredUser(): User | null {
  const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) {
    return null;
  }
  try {
    return JSON.parse(stored) as User;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }
}

export function persistAuth(user: User) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  if (user.token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, user.token);
  }
}

export function clearAuth() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function authHeaders(includeJson = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export function normalizeAuthUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    email: String(raw.email ?? ''),
    role: (raw.role as User['role']) ?? 'PARENT',
    parentId: (raw.parentId ?? raw.parent_id) as string | undefined,
    providerId: (raw.providerId ?? raw.provider_id) as string | undefined,
    token: raw.token as string | undefined,
  };
}

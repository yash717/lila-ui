/**
 * Persists Nakama JWT + refresh token for the SPA.
 * Tokens in localStorage are standard for Nakama JS; httpOnly cookies would require a backend BFF.
 * A non-sensitive cookie flags "logged in" for optional middleware / debugging.
 */

const STORAGE_KEY = 'nebula_nakama_session_v1';
const COOKIE_FLAG = 'nebula_logged_in';

export interface PersistedSession {
  token: string;
  refreshToken: string;
  /** Display name / callsign chosen at login */
  username: string;
}

export function saveSessionPersisted(data: PersistedSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Non-httpOnly flag only — real secrets stay in localStorage
    const maxAge = 60 * 60 * 24 * 60; // ~60 days
    const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE_FLAG}=1; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
  } catch {
    /* private mode / quota */
  }
}

export function loadSessionPersisted(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSession;
    if (!parsed?.token || !parsed?.refreshToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSessionPersisted(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    document.cookie = `${COOKIE_FLAG}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

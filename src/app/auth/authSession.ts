import type { AuthSession } from "../../../domain/entities/authSession";

const SESSION_KEY =
  "ultra-fingerprint-auth-session";

export function saveAuthSession(
  session: AuthSession,
): void {
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session),
  );
}

export function getAuthSession(): AuthSession | null {
  const value = sessionStorage.getItem(SESSION_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthSession;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return getAuthSession() !== null;
}

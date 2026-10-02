import type { AuthSession } from "../../../domain/entities/authSession";

const AUTH_SESSION_KEY =
  "ultra-fingerprint-auth-session";

export function saveAuthSession(
  session: AuthSession,
): void {
  sessionStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify(session),
  );
}

export function getAuthSession(): AuthSession | null {
  const savedSession =
    sessionStorage.getItem(AUTH_SESSION_KEY);

  if (!savedSession) {
    return null;
  }

  try {
    return JSON.parse(savedSession) as AuthSession;
  } catch {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return getAuthSession() !== null;
}

import type { AuthSession } from "../../../domain/entities/authSession";

const SESSION_KEY =
  "ultra-fingerprint-auth-session";

const TRIALS_KEY =
  "ultra-school-trials";

interface TrialRecord {
  schoolId: string;
  userId: string;
  email: string;
  trialStartedAt: string;
  trialEndsAt: string;
  status: "ACTIVE" | "EXPIRED";
}

function getTrialForSchool(
  schoolId: string | null,
): TrialRecord | null {
  if (!schoolId) {
    return null;
  }

  try {
    const trials =
      JSON.parse(
        localStorage.getItem(
          TRIALS_KEY,
        ) ?? "[]",
      ) as TrialRecord[];

    return (
      trials.find(
        (trial) =>
          trial.schoolId === schoolId,
      ) ?? null
    );
  } catch {
    return null;
  }
}

function expireTrial(
  trial: TrialRecord,
): void {
  try {
    const trials =
      JSON.parse(
        localStorage.getItem(
          TRIALS_KEY,
        ) ?? "[]",
      ) as TrialRecord[];

    const updatedTrials =
      trials.map((item) =>
        item.schoolId ===
        trial.schoolId
          ? {
              ...item,
              status: "EXPIRED" as const,
            }
          : item,
      );

    localStorage.setItem(
      TRIALS_KEY,
      JSON.stringify(updatedTrials),
    );
  } catch {
    // Expiry is still enforced by the date check.
  }
}

function isTrialExpired(
  trial: TrialRecord,
): boolean {
  return (
    trial.status === "EXPIRED" ||
    Date.now() >=
      new Date(
        trial.trialEndsAt,
      ).getTime()
  );
}

function isSessionAllowed(
  session: AuthSession,
): boolean {
  const trial =
    getTrialForSchool(
      session.schoolId,
    );

  if (!trial) {
    return true;
  }

  if (
    isTrialExpired(trial)
  ) {
    expireTrial(trial);
    return false;
  }

  return true;
}

export function saveAuthSession(
  session: AuthSession,
): void {
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session),
  );
}

export function getAuthSession(): AuthSession | null {
  const value =
    sessionStorage.getItem(
      SESSION_KEY,
    );

  if (!value) {
    return null;
  }

  try {
    const session =
      JSON.parse(
        value,
      ) as AuthSession;

    if (
      !isSessionAllowed(session)
    ) {
      clearAuthSession();
      return null;
    }

    return session;
  } catch {
    sessionStorage.removeItem(
      SESSION_KEY,
    );

    return null;
  }
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(
    SESSION_KEY,
  );
}

export function isAuthenticated(): boolean {
  return getAuthSession() !== null;
}

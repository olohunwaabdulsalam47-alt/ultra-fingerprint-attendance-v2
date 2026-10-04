import type { AuthSession } from "../../../domain/entities/authSession";
import { saveTrialLock } from "./trialLock";

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

function markTrialExpired(
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
    // Expiry remains enforced by the date.
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

function enforceTrialStatus(
  session: AuthSession,
): boolean {
  // SuperAdmin is a platform-level account
  // and must not be affected by school trials.
  if (
    session.role === "SuperAdmin" ||
    !session.schoolId
  ) {
    return true;
  }

  const trial =
    getTrialForSchool(
      session.schoolId,
    );

  // Existing accounts without a trial
  // remain available.
  if (!trial) {
    return true;
  }

  if (
    !isTrialExpired(trial)
  ) {
    return true;
  }

  markTrialExpired(trial);

  saveTrialLock({
    schoolId: session.schoolId,
    userId: session.userId,
    trialEndsAt: trial.trialEndsAt,
    lockedAt:
      new Date().toISOString(),
  });

  return false;
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
      !enforceTrialStatus(session)
    ) {
      clearAuthSession();
      return null;
    }

    return session;
  } catch {
    clearAuthSession();
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

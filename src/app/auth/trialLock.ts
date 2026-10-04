const TRIAL_LOCK_KEY =
  "ultra-school-trial-lock";

export interface TrialLock {
  schoolId: string;
  userId: string;
  trialEndsAt: string;
  lockedAt: string;
}

export function saveTrialLock(
  lock: TrialLock,
): void {
  localStorage.setItem(
    TRIAL_LOCK_KEY,
    JSON.stringify(lock),
  );
}

export function getTrialLock(): TrialLock | null {
  try {
    const value =
      localStorage.getItem(
        TRIAL_LOCK_KEY,
      );

    if (!value) {
      return null;
    }

    return JSON.parse(value) as TrialLock;
  } catch {
    localStorage.removeItem(
      TRIAL_LOCK_KEY,
    );

    return null;
  }
}

export function clearTrialLock(): void {
  localStorage.removeItem(
    TRIAL_LOCK_KEY,
  );
}

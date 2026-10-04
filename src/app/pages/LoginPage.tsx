import { useEffect, useState } from "react";
import { authenticateUser } from "../auth/authenticateUser";
import {
  getAuthSession,
  saveAuthSession,
} from "../auth/authSession";
import AppPage from "./AppPage";
import "./LoginPage.css";

const TRIALS_KEY = "ultra-school-trials";

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
        localStorage.getItem(TRIALS_KEY) ??
          "[]",
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

function isTrialExpired(
  trial: TrialRecord,
): boolean {
  return (
    Date.now() >=
    new Date(
      trial.trialEndsAt,
    ).getTime()
  );
}

function markTrialExpired(
  trial: TrialRecord,
) {
  try {
    const trials =
      JSON.parse(
        localStorage.getItem(TRIALS_KEY) ??
          "[]",
      ) as TrialRecord[];

    const updatedTrials =
      trials.map((item) =>
        item.schoolId === trial.schoolId
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
    // Trial state remains checked by expiry date.
  }
}

export default function LoginPage() {
  const [staffId, setStaffId] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [authenticated, setAuthenticated] =
    useState(
      getAuthSession() !== null,
    );

  useEffect(() => {
    const handleNavigation = () => {
      setAuthenticated(
        getAuthSession() !== null,
      );
    };

    window.addEventListener(
      "popstate",
      handleNavigation,
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handleNavigation,
      );
    };
  }, []);

  if (authenticated) {
    return <AppPage path="/" />;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (
      !staffId.trim() ||
      !password
    ) {
      setError(
        "Staff ID and password are required.",
      );

      return;
    }

    setLoading(true);

    try {
      const result =
        await authenticateUser(
          staffId,
          password,
        );

      if (
        !result.success ||
        !result.session
      ) {
        setError(
          result.error ??
            "Invalid Staff ID or password.",
        );

        return;
      }

      const trial =
        getTrialForSchool(
          result.session.schoolId,
        );

      if (
        trial &&
        isTrialExpired(trial)
      ) {
        markTrialExpired(trial);

        setError(
          "Your school's 7-day free trial has expired. Please activate a subscription to continue.",
        );

        return;
      }

      saveAuthSession(
        result.session,
      );

      setAuthenticated(true);
    } catch {
      setError(
        "Unable to sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function returnHome() {
    window.history.pushState(
      {},
      "",
      "/",
    );

    window.dispatchEvent(
      new PopStateEvent("popstate"),
    );
  }

  return (
    <main className="login-page">
      <div className="login-background-shape login-background-shape-one" />
      <div className="login-background-shape login-background-shape-two" />

      <section className="login-shell">
        <div className="login-brand-panel">
          <div
            className="login-brand-mark"
            aria-hidden="true"
          >
            UFA
          </div>

          <p className="login-brand-kicker">
            SECURE SCHOOL ATTENDANCE
          </p>

          <h1>
            ULTRA FINGERPRINT
            ATTENDANCE
          </h1>

          <p className="login-brand-description">
            Secure attendance,
            biometric identity and
            school management in one
            trusted platform.
          </p>

          <div className="login-security-list">
            <div>
              <span>✓</span>
              <p>
                Secure school access
              </p>
            </div>

            <div>
              <span>✓</span>
              <p>
                Role-based permissions
              </p>
            </div>

            <div>
              <span>✓</span>
              <p>
                Protected attendance
                records
              </p>
            </div>
          </div>
        </div>

        <div className="login-form-panel">
          <button
            className="login-back-button"
            type="button"
            onClick={returnHome}
          >
            ← Back to Home
          </button>

          <div className="login-heading">
            <p className="login-eyebrow">
              SCHOOL PORTAL
            </p>

            <h2>
              School Login
            </h2>

            <p>
              Sign in with your
              authorized Staff ID and
              password.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            <div className="login-field">
              <label htmlFor="staff-id">
                Staff ID
              </label>

              <input
                id="staff-id"
                name="staffId"
                type="text"
                value={staffId}
                onChange={(event) =>
                  setStaffId(
                    event.target.value,
                  )
                }
                placeholder="Enter your Staff ID"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">
                Password
              </label>

              <div className="login-password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  className="login-password-toggle"
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current,
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  disabled={loading}
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="login-error"
                role="alert"
              >
                <strong>
                  Login failed
                </strong>

                <span>
                  {error}
                </span>
              </div>
            )}

            <button
              className="login-submit-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>
          </form>

          <div className="login-footer">
            <span>
              ULTRA FINGERPRINT
              ATTENDANCE
            </span>

            <span>
              Secure School Platform
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

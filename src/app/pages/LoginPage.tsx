import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import AppLayout from "../components/layout/AppLayout";
import AppPage from "./AppPage";
import { authenticateUser } from "../auth/authenticateUser";
import { saveAuthSession } from "../auth/authSession";
import "./LoginPage.css";

export default function LoginPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedSession = sessionStorage.getItem(
      "ultra-fingerprint-auth-session",
    );

    if (savedSession) {
      setLoggedIn(true);
    }
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    const result = await authenticateUser(
      staffId.trim(),
      password,
    );

    if (!result.success || !result.session) {
      setError(
        result.error ??
          "Invalid Staff ID or password.",
      );
      return;
    }

    saveAuthSession(result.session);
    setLoggedIn(true);
  }

  if (loggedIn) {
    return (
      <AppLayout>
        <AppPage />
      </AppLayout>
    );
  }

  return (
    <main className="login-page">
      <section
        className="login-card"
        aria-labelledby="login-title"
      >
        <div className="login-brand">
          <div
            className="login-icon"
            aria-hidden="true"
          >
            FP
          </div>

          <p className="login-kicker">
            School Attendance Platform
          </p>

          <h1>
            ULTRA FINGERPRINT
            <span>ATTENDANCE</span>
          </h1>
        </div>

        <div className="login-heading">
          <h2 id="login-title">Staff Login</h2>
          <p>
            Sign in with your authorized staff
            account.
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <div className="form-field">
            <label htmlFor="staff-id">
              Staff ID
            </label>

            <input
              id="staff-id"
              type="text"
              value={staffId}
              onChange={(event) =>
                setStaffId(event.target.value)
              }
              placeholder="Enter Staff ID"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter Password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p
              className="login-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            className="login-button"
            type="submit"
          >
            Login
          </button>
        </form>

        <p className="login-footer">
          Secure school attendance management
        </p>
      </section>
    </main>
  );
}

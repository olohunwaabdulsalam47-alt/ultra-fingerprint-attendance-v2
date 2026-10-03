import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AppPage from "./AppPage";

import {
  getAuthSession,
  saveAuthSession,
} from "../auth/authSession";

import { authenticateUser } from "../auth/authenticateUser";

import "./LoginPage.css";

export default function LoginPage() {
  const [staffId, setStaffId] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loggedIn, setLoggedIn] =
    useState(false);

  const [path, setPath] =
    useState(window.location.pathname);

  useEffect(() => {
    const session =
      getAuthSession();

    if (session) {
      setLoggedIn(true);
    }

    const handleNavigation = () => {
      setPath(
        window.location.pathname,
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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const result =
      await authenticateUser(
        staffId.trim(),
        password,
      );

    if (!result.success) {
      setError(
        result.error ??
          "Login failed.",
      );
      return;
    }

    if (!result.session) {
      setError(
        "Authentication succeeded but no session was created.",
      );
      return;
    }

    saveAuthSession(
      result.session,
    );

    window.history.replaceState(
      {},
      "",
      "/",
    );

    window.dispatchEvent(
      new PopStateEvent("popstate"),
    );

    setPath("/");
    setLoggedIn(true);
  }

  if (loggedIn) {
    return (
      <AppPage path={path} />
    );
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <h1>
          ULTRA FINGERPRINT ATTENDANCE
        </h1>

        <p>
          Secure School Attendance Platform
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="staffId">
            Staff ID
          </label>

          <input
            id="staffId"
            type="text"
            value={staffId}
            onChange={(event) =>
              setStaffId(
                event.target.value,
              )
            }
            autoComplete="username"
            required
          />

          <label htmlFor="password">
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value,
              )
            }
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="login-error">
              {error}
            </p>
          )}

          <button type="submit">
            Login
          </button>
        </form>
      </section>
    </main>
  );
}

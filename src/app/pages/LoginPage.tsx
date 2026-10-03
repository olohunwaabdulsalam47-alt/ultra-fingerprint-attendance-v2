import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import AppLayout from "../components/layout/AppLayout";
import AppPage from "./AppPage";
import { authenticateUser } from "../auth/authenticateUser";
import { saveAuthSession } from "../auth/authSession";

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
    <main>
      <h1>ULTRA FINGERPRINT ATTENDANCE</h1>

      <h2>Staff Login</h2>

      <form onSubmit={handleSubmit}>
        <label>
          Staff ID
          <input
            type="text"
            value={staffId}
            onChange={(event) =>
              setStaffId(event.target.value)
            }
            placeholder="Enter Staff ID"
            autoComplete="username"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Enter Password"
            autoComplete="current-password"
            required
          />
        </label>

        <button type="submit">
          Login
        </button>
      </form>

      {error && <p role="alert">{error}</p>}
    </main>
  );
}

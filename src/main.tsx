import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import LoginPage from "./app/pages/LoginPage";
import HomePage from "./app/pages/HomePage";
import SchoolRegistrationPage from "./app/pages/SchoolRegistrationPage";
import ApplicationTrackingPage from "./app/pages/ApplicationTrackingPage";

import { startOfflineSync } from "./app/offline/offlineSyncService";
import { ensureDemoAccount } from "./app/auth/demoAccountSeeder";

startOfflineSync();

function AppEntry() {
  const [path, setPath] = useState(
    window.location.pathname,
  );

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initializeApp() {
      try {
        // Demo accounts may only be initialized
        // during development, never in production.
        if (import.meta.env.DEV) {
          await ensureDemoAccount();
        }
      } catch {
        // Do not expose internal initialization
        // errors to users.
      } finally {
        if (mounted) {
          setInitialized(true);
        }
      }
    }

    void initializeApp();

    const handleNavigation = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener(
      "popstate",
      handleNavigation,
    );

    return () => {
      mounted = false;

      window.removeEventListener(
        "popstate",
        handleNavigation,
      );
    };
  }, []);

  if (!initialized) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          textAlign: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div>
          <h1>ULTRA FINGERPRINT ATTENDANCE</h1>
          <p>Initializing school platform...</p>
        </div>
      </main>
    );
  }

  if (path === "/login") {
    return <LoginPage />;
  }

  if (path === "/register-school") {
    return <SchoolRegistrationPage />;
  }

  if (path === "/track-application") {
    return <ApplicationTrackingPage />;
  }

  if (path === "/") {
    return <HomePage />;
  }

  return <HomePage />;
}

ReactDOM.createRoot(
  document.getElementById("root")!,
).render(
  <React.StrictMode>
    <AppEntry />
  </React.StrictMode>,
);

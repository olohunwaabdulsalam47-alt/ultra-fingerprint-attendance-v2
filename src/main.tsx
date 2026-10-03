import React, {
  useEffect,
  useState,
} from "react";

import ReactDOM from "react-dom/client";

import LoginPage from "./app/pages/LoginPage";
import HomePage from "./app/pages/HomePage";
import SchoolRegistrationPage from "./app/pages/SchoolRegistrationPage";
import ApplicationTrackingPage from "./app/pages/ApplicationTrackingPage";

import { startOfflineSync } from "./app/offline/offlineSyncService";

startOfflineSync();

function AppEntry() {
  const [path, setPath] =
    useState(window.location.pathname);

  useEffect(() => {
    const handleNavigation = () => {
      setPath(window.location.pathname);
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

import React from "react";
import ReactDOM from "react-dom/client";
import LoginPage from "./app/pages/LoginPage";
import HomePage from "./app/pages/HomePage";
import { startOfflineSync } from "./app/offline/offlineSyncService";

startOfflineSync();

function AppEntry() {
  const path = window.location.pathname;

  if (path === "/login") {
    return <LoginPage />;
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

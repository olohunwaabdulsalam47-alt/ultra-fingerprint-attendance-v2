import React from "react";
import ReactDOM from "react-dom/client";
import LoginPage from "./app/pages/LoginPage";
import { startOfflineSync } from "./app/offline/offlineSyncService";

startOfflineSync();

ReactDOM.createRoot(
  document.getElementById("root")!,
).render(
  <React.StrictMode>
    <LoginPage />
  </React.StrictMode>,
);

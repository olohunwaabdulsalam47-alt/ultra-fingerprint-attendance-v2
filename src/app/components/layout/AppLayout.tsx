import type { ReactNode } from "react";
import AppNavigation from "../navigation/AppNavigation";
import ConnectionStatus from "../system/ConnectionStatus";
import LogoutButton from "../../auth/LogoutButton";
import { getAuthSession } from "../../auth/authSession";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({
  children,
}: AppLayoutProps) {
  const session = getAuthSession();

  return (
    <div>
      <header>
        <h1>ULTRA FINGERPRINT ATTENDANCE</h1>
        <p>School Attendance Management System</p>

        {session && (
          <p>
            Logged in as{" "}
            <strong>{session.name}</strong> —{" "}
            {session.role}
          </p>
        )}

        <ConnectionStatus />

        {session && <LogoutButton />}
      </header>

      <AppNavigation />

      <main>{children}</main>

      <footer>
        <p>ULTRA FINGERPRINT ATTENDANCE</p>
        <p>
          Local attendance data is stored on this device.
        </p>
      </footer>
    </div>
  );
}

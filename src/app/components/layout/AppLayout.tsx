import type { ReactNode } from "react";
import AppNavigation from "./AppNavigation";

interface AppLayoutProps {
  children?: ReactNode;
}

export default function AppLayout({
  children,
}: AppLayoutProps) {
  return (
    <div>
      <header>
        <h1>ULTRA FINGERPRINT ATTENDANCE</h1>
      </header>

      <AppNavigation />

      <main>{children}</main>
    </div>
  );
}

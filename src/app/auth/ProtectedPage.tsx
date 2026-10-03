import {
  useEffect,
  type ReactNode,
} from "react";
import type { Permission } from "./permissions";
import { getAuthSession } from "./authSession";
import { hasPermission } from "./permissions";

interface ProtectedPageProps {
  permission: Permission;
  children: ReactNode;
}

export default function ProtectedPage({
  permission,
  children,
}: ProtectedPageProps) {
  const session = getAuthSession();

  useEffect(() => {
    if (!session) {
      window.history.replaceState({}, "", "/login");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, [session]);

  if (!session) {
    return null;
  }

  if (!hasPermission(session.role, permission)) {
    return (
      <section
        style={{
          padding: "32px",
          maxWidth: "760px",
          margin: "0 auto",
        }}
      >
        <h1>Access Denied</h1>

        <p>
          Your account does not have permission to
          access this section.
        </p>

        <button
          type="button"
          onClick={() => {
            window.history.pushState(
              {},
              "",
              "/",
            );
            window.dispatchEvent(
              new PopStateEvent("popstate"),
            );
          }}
        >
          Return to Dashboard
        </button>
      </section>
    );
  }

  return <>{children}</>;
}

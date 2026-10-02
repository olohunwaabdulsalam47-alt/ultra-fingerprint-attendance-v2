import type { ReactNode } from "react";
import { getAuthSession } from "./authSession";
import {
  hasPermission,
  type Permission,
} from "./permissions";

interface ProtectedPageProps {
  permission: Permission;
  children: ReactNode;
}

export default function ProtectedPage({
  permission,
  children,
}: ProtectedPageProps) {
  const session = getAuthSession();

  if (!session) {
    return (
      <section>
        <h2>Access Denied</h2>
        <p>
          You must be logged in to access this page.
        </p>
      </section>
    );
  }

  if (!hasPermission(session.role, permission)) {
    return (
      <section>
        <h2>Access Denied</h2>
        <p>
          Your account does not have permission to access
          this section.
        </p>
      </section>
    );
  }

  return <>{children}</>;
}

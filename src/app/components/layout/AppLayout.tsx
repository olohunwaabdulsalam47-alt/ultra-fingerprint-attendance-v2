import { getAuthSession } from "../../auth/authSession";
import {
  getRolePermissions,
  hasPermission,
} from "../../auth/permissions";

function getBasePath(): string {
  const base = import.meta.env.BASE_URL;

  return base.endsWith("/")
    ? base.slice(0, -1)
    : base;
}

function navigate(path: string): void {
  window.location.href = `${getBasePath()}${path}`;
}

export default function AppNavigation() {
  const session = getAuthSession();

  if (!session) {
    return null;
  }

  const permissions =
    getRolePermissions(session.role);

  return (
    <nav aria-label="Main navigation">
      <ul>
        <li>
          <button
            type="button"
            onClick={() => navigate("/")}
          >
            Dashboard
          </button>
        </li>

        {hasPermission(
          session.role,
          "MANAGE_USERS",
        ) && (
          <li>
            <button
              type="button"
              onClick={() => navigate("/users")}
            >
              Users
            </button>
          </li>
        )}

        {hasPermission(
          session.role,
          "MANAGE_STUDENTS",
        ) && (
          <li>
            <button
              type="button"
              onClick={() =>
                navigate("/students")
              }
            >
              Students
            </button>
          </li>
        )}

        {hasPermission(
          session.role,
          "RECORD_ATTENDANCE",
        ) && (
          <li>
            <button
              type="button"
              onClick={() =>
                navigate("/attendance")
              }
            >
              Attendance
            </button>
          </li>
        )}

        {hasPermission(
          session.role,
          "REGISTER_BIOMETRIC",
        ) && (
          <li>
            <button
              type="button"
              onClick={() =>
                navigate("/biometric")
              }
            >
              Biometric
            </button>
          </li>
        )}

        {hasPermission(
          session.role,
          "VIEW_AUDIT_LOGS",
        ) && (
          <li>
            <button
              type="button"
              onClick={() =>
                navigate("/audit")
              }
            >
              Audit Logs
            </button>
          </li>
        )}

        <li>
          <span>
            Permissions: {permissions.length}
          </span>
        </li>
      </ul>
    </nav>
  );
}

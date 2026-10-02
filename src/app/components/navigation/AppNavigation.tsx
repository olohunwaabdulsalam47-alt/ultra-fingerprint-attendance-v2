import { getAuthSession } from "../../auth/authSession";
import {
  hasPermission,
  type Permission,
} from "../../auth/permissions";

interface NavigationItem {
  label: string;
  href: string;
  permission: Permission;
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/",
    permission: "VIEW_DASHBOARD",
  },
  {
    label: "Schools",
    href: "/schools",
    permission: "MANAGE_SCHOOLS",
  },
  {
    label: "Classes",
    href: "/classes",
    permission: "MANAGE_CLASSES",
  },
  {
    label: "Students",
    href: "/students",
    permission: "MANAGE_STUDENTS",
  },
  {
    label: "Attendance",
    href: "/attendance",
    permission: "RECORD_ATTENDANCE",
  },
  {
    label: "Reports",
    href: "/reports",
    permission: "VIEW_REPORTS",
  },
  {
    label: "Users",
    href: "/users",
    permission: "MANAGE_USERS",
  },
  {
    label: "Biometric",
    href: "/biometric",
    permission: "MANAGE_BIOMETRIC",
  },
  {
    label: "Audit Logs",
    href: "/audit-logs",
    permission: "VIEW_AUDIT_LOGS",
  },
];

export default function AppNavigation() {
  const session = getAuthSession();

  if (!session) {
    return null;
  }

  const visibleItems = navigationItems.filter(
    (item) =>
      hasPermission(session.role, item.permission),
  );

  return (
    <nav aria-label="Main navigation">
      <ul>
        {visibleItems.map((item) => (
          <li key={item.href}>
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

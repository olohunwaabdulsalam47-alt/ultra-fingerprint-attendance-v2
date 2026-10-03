import DashboardPage from "./DashboardPage";
import SchoolsPage from "./SchoolsPage";
import SchoolApplicationsPage from "./SchoolApplicationsPage";
import SuperAdminSchoolsPage from "./SuperAdminSchoolsPage";
import ClassesPage from "./ClassesPage";
import StudentsPage from "./StudentsPage";
import AttendancePage from "./AttendancePage";
import ReportsPage from "./ReportsPage";
import UsersPage from "./UsersPage";
import BiometricPage from "./BiometricPage";
import AuditLogsPage from "./AuditLogsPage";
import ProtectedPage from "../auth/ProtectedPage";

export default function AppPage() {
  const path = window.location.pathname;

  let page = (
    <ProtectedPage permission="VIEW_DASHBOARD">
      <DashboardPage />
    </ProtectedPage>
  );

  if (path === "/school-applications") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <SchoolApplicationsPage />
      </ProtectedPage>
    );
  }

  if (path === "/superadmin-schools") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <SuperAdminSchoolsPage />
      </ProtectedPage>
    );
  }

  if (path === "/schools") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <SchoolsPage />
      </ProtectedPage>
    );
  }

  if (path === "/classes") {
    page = (
      <ProtectedPage permission="MANAGE_CLASSES">
        <ClassesPage />
      </ProtectedPage>
    );
  }

  if (path === "/students") {
    page = (
      <ProtectedPage permission="MANAGE_STUDENTS">
        <StudentsPage />
      </ProtectedPage>
    );
  }

  if (path === "/attendance") {
    page = (
      <ProtectedPage permission="RECORD_ATTENDANCE">
        <AttendancePage />
      </ProtectedPage>
    );
  }

  if (path === "/reports") {
    page = (
      <ProtectedPage permission="VIEW_REPORTS">
        <ReportsPage />
      </ProtectedPage>
    );
  }

  if (path === "/users") {
    page = (
      <ProtectedPage permission="MANAGE_USERS">
        <UsersPage />
      </ProtectedPage>
    );
  }

  if (path === "/biometric") {
    page = (
      <ProtectedPage permission="MANAGE_BIOMETRIC">
        <BiometricPage />
      </ProtectedPage>
    );
  }

  if (path === "/audit-logs") {
    page = (
      <ProtectedPage permission="VIEW_AUDIT_LOGS">
        <AuditLogsPage />
      </ProtectedPage>
    );
  }

  return page;
}

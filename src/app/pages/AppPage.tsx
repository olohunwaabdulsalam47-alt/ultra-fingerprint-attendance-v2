import DashboardPage from "./DashboardPage";
import PrincipalDashboardPage from "./PrincipalDashboardPage";
import SchoolProfileSettingsPage from "./SchoolProfileSettingsPage";
import ClassAcademicStructurePage from "./ClassAcademicStructurePage";
import StudentEnrollmentPage from "./StudentEnrollmentPage";
import TeacherStaffManagementPage from "./TeacherStaffManagementPage";
import TeacherAssignmentPage from "./TeacherAssignmentPage";
import SubjectCurriculumPage from "./SubjectCurriculumPage";
import TimetableSchedulePage from "./TimetableSchedulePage";
import ExaminationAssessmentPage from "./ExaminationAssessmentPage";
import SchoolsPage from "./SchoolsPage";
import SchoolApplicationsPage from "./SchoolApplicationsPage";
import SuperAdminSchoolsPage from "./SuperAdminSchoolsPage";
import SuperAdminSubscriptionsPage from "./SuperAdminSubscriptionsPage";
import SuperAdminPaymentsPage from "./SuperAdminPaymentsPage";
import SuperAdminUsersPage from "./SuperAdminUsersPage";
import SuperAdminSecurityPage from "./SuperAdminSecurityPage";
import SuperAdminAuditCompliancePage from "./SuperAdminAuditCompliancePage";
import SuperAdminSupportIncidentPage from "./SuperAdminSupportIncidentPage";
import SuperAdminCommunicationPage from "./SuperAdminCommunicationPage";
import SuperAdminOperationsPage from "./SuperAdminOperationsPage";
import SuperAdminDataPrivacyPage from "./SuperAdminDataPrivacyPage";
import SuperAdminAnalyticsToolsPage from "./SuperAdminAnalyticsToolsPage";
import SuperAdminHardeningPage from "./SuperAdminHardeningPage";
import ClassesPage from "./ClassesPage";
import StudentsPage from "./StudentsPage";
import AttendancePage from "./AttendancePage";
import ReportsPage from "./ReportsPage";
import UsersPage from "./UsersPage";
import BiometricPage from "./BiometricPage";
import AuditLogsPage from "./AuditLogsPage";
import ProtectedPage from "../auth/ProtectedPage";

export default function AppPage({
  path,
}: {
  path: string;
}) {
  let page = (
    <ProtectedPage permission="VIEW_DASHBOARD">
      <DashboardPage />
    </ProtectedPage>
  );

  if (path === "/principal-dashboard") {
    page = (
      <ProtectedPage permission="VIEW_DASHBOARD">
        <PrincipalDashboardPage />
      </ProtectedPage>
    );
  }

  if (path === "/school-profile-settings") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <SchoolProfileSettingsPage />
      </ProtectedPage>
    );
  }

  if (path === "/class-academic-structure") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <ClassAcademicStructurePage />
      </ProtectedPage>
    );
  }

  if (path === "/student-enrollment") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <StudentEnrollmentPage />
      </ProtectedPage>
    );
  }

  if (path === "/teacher-staff-management") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <TeacherStaffManagementPage />
      </ProtectedPage>
    );
  }

  if (path === "/teacher-assignment") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <TeacherAssignmentPage />
      </ProtectedPage>
    );
  }

  if (path === "/subject-curriculum") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <SubjectCurriculumPage />
      </ProtectedPage>
    );
  }

  if (path === "/timetable-schedule") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <TimetableSchedulePage />
      </ProtectedPage>
    );
  }

  if (path === "/examination-assessment") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <ExaminationAssessmentPage />
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

  if (path === "/superadmin-subscriptions") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <SuperAdminSubscriptionsPage />
      </ProtectedPage>
    );
  }

  if (path === "/superadmin-payments") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <SuperAdminPaymentsPage />
      </ProtectedPage>
    );
  }

  if (path === "/superadmin-users") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <SuperAdminUsersPage />
      </ProtectedPage>
    );
  }

  if (path === "/superadmin-security") {
    page = (
      <ProtectedPage permission="VIEW_AUDIT_LOGS">
        <SuperAdminSecurityPage />
      </ProtectedPage>
    );
  }

  if (path === "/superadmin-audit-compliance") {
    page = (
      <ProtectedPage permission="VIEW_AUDIT_LOGS">
        <SuperAdminAuditCompliancePage />
      </ProtectedPage>
    );
  }

  if (path === "/superadmin-support-incidents") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <SuperAdminSupportIncidentPage />
      </ProtectedPage>
    );
  }

  if (path === "/superadmin-communication") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <SuperAdminCommunicationPage />
      </ProtectedPage>
    );
  }

  if (path === "/superadmin-operations") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <SuperAdminOperationsPage />
      </ProtectedPage>
    );
  }

  if (path === "/superadmin-data-privacy") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <SuperAdminDataPrivacyPage />
      </ProtectedPage>
    );
  }

  if (path === "/superadmin-analytics-tools") {
    page = (
      <ProtectedPage permission="VIEW_REPORTS">
        <SuperAdminAnalyticsToolsPage />
      </ProtectedPage>
    );
  }

  if (path === "/superadmin-hardening") {
    page = (
      <ProtectedPage permission="VIEW_AUDIT_LOGS">
        <SuperAdminHardeningPage />
      </ProtectedPage>
    );
  }

  if (path === "/classes") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <ClassesPage />
      </ProtectedPage>
    );
  }

  if (path === "/students") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <StudentsPage />
      </ProtectedPage>
    );
  }

  if (path === "/attendance") {
    page = (
      <ProtectedPage permission="VIEW_DASHBOARD">
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
      <ProtectedPage permission="MANAGE_SCHOOLS">
        <UsersPage />
      </ProtectedPage>
    );
  }

  if (path === "/biometric") {
    page = (
      <ProtectedPage permission="MANAGE_SCHOOLS">
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

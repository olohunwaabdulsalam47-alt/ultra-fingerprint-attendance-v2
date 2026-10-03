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
import ResultsScoreManagementPage from "./ResultsScoreManagementPage";
import ReportCardsResultsPage from "./ReportCardsResultsPage";

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
import type { Permission } from "../auth/permissions";

interface AppPageProps {
  path: string;
}

interface RouteConfig {
  permission: Permission;
  element: React.ReactNode;
}

export default function AppPage({
  path,
}: AppPageProps) {
  const routes: Record<string, RouteConfig> = {
    "/": {
      permission: "VIEW_DASHBOARD",
      element: <DashboardPage />,
    },

    "/principal-dashboard": {
      permission: "MANAGE_SCHOOLS",
      element: <PrincipalDashboardPage />,
    },

    "/school-profile-settings": {
      permission: "MANAGE_SCHOOLS",
      element: <SchoolProfileSettingsPage />,
    },

    "/class-academic-structure": {
      permission: "MANAGE_CLASSES",
      element: <ClassAcademicStructurePage />,
    },

    "/student-enrollment": {
      permission: "MANAGE_STUDENTS",
      element: <StudentEnrollmentPage />,
    },

    "/teacher-staff-management": {
      permission: "MANAGE_USERS",
      element: <TeacherStaffManagementPage />,
    },

    "/teacher-assignment": {
      permission: "MANAGE_USERS",
      element: <TeacherAssignmentPage />,
    },

    "/subject-curriculum": {
      permission: "MANAGE_SCHOOLS",
      element: <SubjectCurriculumPage />,
    },

    "/timetable-schedule": {
      permission: "MANAGE_SCHOOLS",
      element: <TimetableSchedulePage />,
    },

    "/examination-assessment": {
      permission: "MANAGE_SCHOOLS",
      element: <ExaminationAssessmentPage />,
    },

    "/results-score-management": {
      permission: "MANAGE_SCHOOLS",
      element: <ResultsScoreManagementPage />,
    },

    "/report-cards-results": {
      permission: "VIEW_REPORTS",
      element: <ReportCardsResultsPage />,
    },

    "/schools": {
      permission: "MANAGE_PLATFORM",
      element: <SchoolsPage />,
    },

    "/school-applications": {
      permission: "MANAGE_PLATFORM",
      element: <SchoolApplicationsPage />,
    },

    "/superadmin-schools": {
      permission: "MANAGE_PLATFORM",
      element: <SuperAdminSchoolsPage />,
    },

    "/superadmin-subscriptions": {
      permission: "MANAGE_PLATFORM",
      element: <SuperAdminSubscriptionsPage />,
    },

    "/superadmin-payments": {
      permission: "MANAGE_PLATFORM",
      element: <SuperAdminPaymentsPage />,
    },

    "/superadmin-users": {
      permission: "MANAGE_PLATFORM",
      element: <SuperAdminUsersPage />,
    },

    "/superadmin-security": {
      permission: "MANAGE_PLATFORM",
      element: <SuperAdminSecurityPage />,
    },

    "/superadmin-audit-compliance": {
      permission: "MANAGE_PLATFORM",
      element: <SuperAdminAuditCompliancePage />,
    },

    "/superadmin-support-incidents": {
      permission: "MANAGE_PLATFORM",
      element: <SuperAdminSupportIncidentPage />,
    },

    "/superadmin-communication": {
      permission: "MANAGE_PLATFORM",
      element: <SuperAdminCommunicationPage />,
    },

    "/superadmin-operations": {
      permission: "MANAGE_PLATFORM",
      element: <SuperAdminOperationsPage />,
    },

    "/superadmin-data-privacy": {
      permission: "MANAGE_PLATFORM",
      element: <SuperAdminDataPrivacyPage />,
    },

    "/superadmin-analytics-tools": {
      permission: "MANAGE_PLATFORM",
      element: <SuperAdminAnalyticsToolsPage />,
    },

    "/superadmin-hardening": {
      permission: "MANAGE_PLATFORM",
      element: <SuperAdminHardeningPage />,
    },

    "/classes": {
      permission: "MANAGE_CLASSES",
      element: <ClassesPage />,
    },

    "/students": {
      permission: "MANAGE_STUDENTS",
      element: <StudentsPage />,
    },

    "/attendance": {
      permission: "RECORD_ATTENDANCE",
      element: <AttendancePage />,
    },

    "/reports": {
      permission: "VIEW_REPORTS",
      element: <ReportsPage />,
    },

    "/users": {
      permission: "MANAGE_USERS",
      element: <UsersPage />,
    },

    "/biometric": {
      permission: "MANAGE_BIOMETRIC",
      element: <BiometricPage />,
    },

    "/audit-logs": {
      permission: "VIEW_AUDIT_LOGS",
      element: <AuditLogsPage />,
    },
  };

  const route = routes[path] ?? routes["/"];

  return (
    <ProtectedPage
      permission={route.permission}
    >
      {route.element}
    </ProtectedPage>
  );
}

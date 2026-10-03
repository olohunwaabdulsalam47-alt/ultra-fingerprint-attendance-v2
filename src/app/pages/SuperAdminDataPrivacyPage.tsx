import { useEffect, useMemo, useState } from "react";
import "./SuperAdminDataPrivacyPage.css";

type RetentionPeriod = "30_DAYS" | "90_DAYS" | "1_YEAR" | "3_YEARS" | "7_YEARS" | "INDEFINITE";
type RequestStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";
type RequestType = "EXPORT" | "DELETION" | "ACCESS" | "CORRECTION";

interface DataPolicy {
  attendanceRetention: RetentionPeriod;
  auditRetention: RetentionPeriod;
  inactiveSchoolRetention: RetentionPeriod;
  biometricRetention: RetentionPeriod;
  automaticCleanup: boolean;
  privacyMode: "STANDARD" | "STRICT";
  updatedAt: string;
}

interface DataRequest {
  id: string;
  schoolName: string;
  type: RequestType;
  status: RequestStatus;
  requestedAt: string;
  requestedBy: string;
}

interface ComplianceItem {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const POLICY_KEY = "ultra-platform-data-policy";
const REQUESTS_KEY = "ultra-platform-data-requests";
const COMPLIANCE_KEY = "ultra-platform-compliance-controls";

const defaultPolicy: DataPolicy = {
  attendanceRetention: "3_YEARS",
  auditRetention: "7_YEARS",
  inactiveSchoolRetention: "1_YEAR",
  biometricRetention: "1_YEAR",
  automaticCleanup: false,
  privacyMode: "STANDARD",
  updatedAt: new Date().toISOString(),
};

const defaultRequests: DataRequest[] = [
  {
    id: "DR-1001",
    schoolName: "Demo School",
    type: "EXPORT",
    status: "PENDING",
    requestedAt: new Date().toISOString(),
    requestedBy: "School Administrator",
  },
  {
    id: "DR-1002",
    schoolName: "Example Academy",
    type: "ACCESS",
    status: "PROCESSING",
    requestedAt: new Date().toISOString(),
    requestedBy: "Principal",
  },
];

const defaultCompliance: ComplianceItem[] = [
  {
    id: "privacy-notice",
    name: "Privacy Notice",
    description: "Platform privacy notice is published and available to users.",
    enabled: true,
  },
  {
    id: "consent-management",
    name: "Consent Management",
    description: "Consent records are required where applicable.",
    enabled: true,
  },
  {
    id: "data-minimization",
    name: "Data Minimization",
    description: "Only required information should be collected and retained.",
    enabled: true,
  },
  {
    id: "access-review",
    name: "Periodic Access Review",
    description: "Privileged access should be reviewed regularly.",
    enabled: true,
  },
  {
    id: "retention-controls",
    name: "Retention Controls",
    description: "Retention policies should be defined before automatic cleanup is enabled.",
    enabled: false,
  },
];

function loadJson<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);

    if (!stored) {
      return fallback;
    }

    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function retentionLabel(value: RetentionPeriod) {
  const labels: Record<RetentionPeriod, string> = {
    "30_DAYS": "30 Days",
    "90_DAYS": "90 Days",
    "1_YEAR": "1 Year",
    "3_YEARS": "3 Years",
    "7_YEARS": "7 Years",
    INDEFINITE: "Indefinite",
  };

  return labels[value];
}

function requestTypeLabel(value: RequestType) {
  const labels: Record<RequestType, string> = {
    EXPORT: "Data Export",
    DELETION: "Data Deletion",
    ACCESS: "Data Access",
    CORRECTION: "Data Correction",
  };

  return labels[value];
}

export default function SuperAdminDataPrivacyPage() {
  const [policy, setPolicy] = useState<DataPolicy>(() =>
    loadJson(POLICY_KEY, defaultPolicy),
  );

  const [requests, setRequests] = useState<DataRequest[]>(() =>
    loadJson(REQUESTS_KEY, defaultRequests),
  );

  const [compliance, setCompliance] = useState<ComplianceItem[]>(() =>
    loadJson(COMPLIANCE_KEY, defaultCompliance),
  );

  const [exportMessage, setExportMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(POLICY_KEY, JSON.stringify(policy));
  }, [policy]);

  useEffect(() => {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(COMPLIANCE_KEY, JSON.stringify(compliance));
  }, [compliance]);

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "PENDING").length,
    [requests],
  );

  const completedRequests = useMemo(
    () => requests.filter((request) => request.status === "COMPLETED").length,
    [requests],
  );

  const enabledControls = useMemo(
    () => compliance.filter((item) => item.enabled).length,
    [compliance],
  );

  function updatePolicy<K extends keyof DataPolicy>(
    key: K,
    value: DataPolicy[K],
  ) {
    setPolicy((current) => ({
      ...current,
      [key]: value,
      updatedAt: new Date().toISOString(),
    }));
  }

  function updateRequestStatus(id: string, status: RequestStatus) {
    setRequests((current) =>
      current.map((request) =>
        request.id === id
          ? {
              ...request,
              status,
            }
          : request,
      ),
    );
  }

  function toggleCompliance(id: string) {
    setCompliance((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              enabled: !item.enabled,
            }
          : item,
      ),
    );
  }

  function createRequest(type: RequestType) {
    const request: DataRequest = {
      id: `DR-${Date.now()}`,
      schoolName: "Platform Test School",
      type,
      status: "PENDING",
      requestedAt: new Date().toISOString(),
      requestedBy: "SuperAdmin",
    };

    setRequests((current) => [request, ...current]);
  }

  function exportConfiguration() {
    const payload = {
      exportedAt: new Date().toISOString(),
      dataPolicy: policy,
      dataRequests: requests,
      complianceControls: compliance,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `ufa-data-privacy-configuration-${Date.now()}.json`;
    anchor.click();

    URL.revokeObjectURL(url);

    setExportMessage("Configuration export prepared successfully.");
  }

  return (
    <main className="data-privacy-page">
      <header className="data-privacy-header">
        <div>
          <p className="data-privacy-eyebrow">SUPERADMIN CENTER</p>
          <h1>Data, Privacy & Compliance</h1>
          <p>
            Manage platform-wide data lifecycle policies, privacy controls,
            compliance settings, and data requests.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={exportConfiguration}
        >
          Export Configuration
        </button>
      </header>

      {exportMessage && (
        <div className="data-privacy-message">{exportMessage}</div>
      )}

      <section className="data-privacy-stats">
        <article className="data-privacy-stat-card">
          <span>Pending Requests</span>
          <strong>{pendingRequests}</strong>
        </article>

        <article className="data-privacy-stat-card">
          <span>Completed Requests</span>
          <strong>{completedRequests}</strong>
        </article>

        <article className="data-privacy-stat-card">
          <span>Enabled Controls</span>
          <strong>{enabledControls}</strong>
        </article>

        <article className="data-privacy-stat-card">
          <span>Privacy Mode</span>
          <strong>{policy.privacyMode}</strong>
        </article>
      </section>

      <section className="data-privacy-card">
        <div className="section-heading">
          <div>
            <h2>Data Retention Policies</h2>
            <p>
              Define how long platform data should be retained. These are
              configuration values for the current development environment.
            </p>
          </div>
        </div>

        <div className="policy-grid">
          <label>
            Attendance Data
            <select
              value={policy.attendanceRetention}
              onChange={(event) =>
                updatePolicy(
                  "attendanceRetention",
                  event.target.value as RetentionPeriod,
                )
              }
            >
              {Object.keys(
                defaultPolicy,
              ).length > 0 &&
                (
                  [
                    "30_DAYS",
                    "90_DAYS",
                    "1_YEAR",
                    "3_YEARS",
                    "7_YEARS",
                    "INDEFINITE",
                  ] as RetentionPeriod[]
                ).map((value) => (
                  <option key={value} value={value}>
                    {retentionLabel(value)}
                  </option>
                ))}
            </select>
          </label>

          <label>
            Audit Logs
            <select
              value={policy.auditRetention}
              onChange={(event) =>
                updatePolicy(
                  "auditRetention",
                  event.target.value as RetentionPeriod,
                )
              }
            >
              {(
                [
                  "30_DAYS",
                  "90_DAYS",
                  "1_YEAR",
                  "3_YEARS",
                  "7_YEARS",
                  "INDEFINITE",
                ] as RetentionPeriod[]
              ).map((value) => (
                <option key={value} value={value}>
                  {retentionLabel(value)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Inactive Schools
            <select
              value={policy.inactiveSchoolRetention}
              onChange={(event) =>
                updatePolicy(
                  "inactiveSchoolRetention",
                  event.target.value as RetentionPeriod,
                )
              }
            >
              {(
                [
                  "30_DAYS",
                  "90_DAYS",
                  "1_YEAR",
                  "3_YEARS",
                  "7_YEARS",
                  "INDEFINITE",
                ] as RetentionPeriod[]
              ).map((value) => (
                <option key={value} value={value}>
                  {retentionLabel(value)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Biometric Data
            <select
              value={policy.biometricRetention}
              onChange={(event) =>
                updatePolicy(
                  "biometricRetention",
                  event.target.value as RetentionPeriod,
                )
              }
            >
              {(
                [
                  "30_DAYS",
                  "90_DAYS",
                  "1_YEAR",
                  "3_YEARS",
                  "7_YEARS",
                  "INDEFINITE",
                ] as RetentionPeriod[]
              ).map((value) => (
                <option key={value} value={value}>
                  {retentionLabel(value)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="policy-options">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={policy.automaticCleanup}
              onChange={(event) =>
                updatePolicy("automaticCleanup", event.target.checked)
              }
            />
            <span>
              <strong>Automatic data cleanup</strong>
              <small>
                Keep disabled until a production retention engine is
                implemented and verified.
              </small>
            </span>
          </label>

          <label className="checkbox-row">
            <span>
              <strong>Privacy Mode</strong>
              <small>Controls the platform's privacy configuration level.</small>
            </span>

            <select
              value={policy.privacyMode}
              onChange={(event) =>
                updatePolicy(
                  "privacyMode",
                  event.target.value as DataPolicy["privacyMode"],
                )
              }
            >
              <option value="STANDARD">Standard</option>
              <option value="STRICT">Strict</option>
            </select>
          </label>
        </div>

        <p className="last-updated">
          Policy updated: {formatDate(policy.updatedAt)}
        </p>
      </section>

      <section className="data-privacy-card">
        <div className="section-heading">
          <div>
            <h2>Data Subject Requests</h2>
            <p>
              Track access, export, correction, and deletion requests.
            </p>
          </div>

          <div className="request-actions">
            <button type="button" onClick={() => createRequest("ACCESS")}>
              New Access Request
            </button>
            <button type="button" onClick={() => createRequest("EXPORT")}>
              New Export Request
            </button>
            <button type="button" onClick={() => createRequest("DELETION")}>
              New Deletion Request
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>School</th>
                <th>Request</th>
                <th>Status</th>
                <th>Requested By</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>{request.schoolName}</td>
                  <td>{requestTypeLabel(request.type)}</td>
                  <td>
                    <span
                      className={`request-status request-status-${request.status.toLowerCase()}`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td>{request.requestedBy}</td>
                  <td>{formatDate(request.requestedAt)}</td>
                  <td>
                    <select
                      value={request.status}
                      onChange={(event) =>
                        updateRequestStatus(
                          request.id,
                          event.target.value as RequestStatus,
                        )
                      }
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="data-privacy-card">
        <div className="section-heading">
          <div>
            <h2>Compliance Controls</h2>
            <p>
              Enable or disable platform-level privacy and compliance
              safeguards.
            </p>
          </div>
        </div>

        <div className="compliance-list">
          {compliance.map((item) => (
            <div className="compliance-item" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
              </div>

              <button
                type="button"
                className={`toggle-button ${
                  item.enabled ? "toggle-on" : "toggle-off"
                }`}
                onClick={() => toggleCompliance(item.id)}
                aria-label={`Toggle ${item.name}`}
              >
                <span>{item.enabled ? "Enabled" : "Disabled"}</span>
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

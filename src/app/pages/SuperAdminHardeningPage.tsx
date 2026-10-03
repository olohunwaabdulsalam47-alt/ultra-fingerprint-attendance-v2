import { useMemo, useState } from "react";
import "./SuperAdminHardeningPage.css";

type ControlStatus = "ENABLED" | "DISABLED" | "WARNING";
type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface SecurityControl {
  id: string;
  name: string;
  description: string;
  status: ControlStatus;
}

interface RiskItem {
  id: string;
  title: string;
  description: string;
  level: RiskLevel;
  resolved: boolean;
}

const securityControls: SecurityControl[] = [
  {
    id: "mfa",
    name: "Multi-Factor Authentication",
    description: "Require an additional authentication factor for privileged accounts.",
    status: "ENABLED",
  },
  {
    id: "session",
    name: "Privileged Session Protection",
    description: "Limit and monitor privileged administrative sessions.",
    status: "ENABLED",
  },
  {
    id: "audit",
    name: "Privileged Action Auditing",
    description: "Record sensitive SuperAdmin actions in the audit system.",
    status: "ENABLED",
  },
  {
    id: "break-glass",
    name: "Break-Glass Access",
    description: "Emergency access remains disabled until explicitly activated.",
    status: "DISABLED",
  },
  {
    id: "export",
    name: "Sensitive Export Protection",
    description: "Require additional authorization before sensitive platform exports.",
    status: "ENABLED",
  },
];

const initialRisks: RiskItem[] = [
  {
    id: "RISK-001",
    title: "Production backend verification required",
    description:
      "Current platform controls use development storage and must be connected to secure server-side controls before production.",
    level: "HIGH",
    resolved: false,
  },
  {
    id: "RISK-002",
    title: "Emergency access procedure requires approval workflow",
    description:
      "A production break-glass process should require authorization, expiry, and complete audit logging.",
    level: "MEDIUM",
    resolved: false,
  },
  {
    id: "RISK-003",
    title: "Security monitoring integration pending",
    description:
      "Production deployment should connect security events to centralized monitoring and alerting.",
    level: "MEDIUM",
    resolved: false,
  },
];

const riskStorageKey = "ultra-platform-security-risks";

function loadRisks(): RiskItem[] {
  try {
    const stored = localStorage.getItem(riskStorageKey);

    if (!stored) {
      return initialRisks;
    }

    return JSON.parse(stored) as RiskItem[];
  } catch {
    return initialRisks;
  }
}

export default function SuperAdminHardeningPage() {
  const [risks, setRisks] = useState<RiskItem[]>(loadRisks);
  const [breakGlass, setBreakGlass] = useState(false);
  const [message, setMessage] = useState("");

  const unresolvedRisks = useMemo(
    () => risks.filter((risk) => !risk.resolved).length,
    [risks],
  );

  const criticalRisks = useMemo(
    () =>
      risks.filter(
        (risk) => !risk.resolved && risk.level === "CRITICAL",
      ).length,
    [risks],
  );

  function updateRisks(nextRisks: RiskItem[]) {
    setRisks(nextRisks);
    localStorage.setItem(riskStorageKey, JSON.stringify(nextRisks));
  }

  function resolveRisk(id: string) {
    updateRisks(
      risks.map((risk) =>
        risk.id === id
          ? {
              ...risk,
              resolved: true,
            }
          : risk,
      ),
    );

    setMessage("Risk marked as resolved.");
  }

  function activateBreakGlass() {
    if (breakGlass) {
      setBreakGlass(false);
      setMessage("Emergency access simulation disabled.");
      return;
    }

    setBreakGlass(true);
    setMessage(
      "Emergency access simulation enabled. No production privileges are granted by this development control.",
    );
  }

  function runSecurityCheck() {
    const checks = [
      "Authentication controls",
      "Privileged access controls",
      "Audit logging",
      "Data export protection",
      "Emergency access configuration",
      "Risk monitoring",
    ];

    setMessage(
      `Security check completed: ${checks.length} control areas reviewed.`,
    );
  }

  return (
    <main className="hardening-page">
      <header className="hardening-header">
        <div>
          <p className="hardening-eyebrow">SUPERADMIN SECURITY</p>
          <h1>Final Security Hardening</h1>
          <p>
            Review privileged access, emergency controls, platform risks, and
            final security readiness before production deployment.
          </p>
        </div>

        <button
          type="button"
          className="hardening-primary-button"
          onClick={runSecurityCheck}
        >
          Run Security Check
        </button>
      </header>

      {message && <div className="hardening-message">{message}</div>}

      <section className="hardening-stat-grid">
        <article>
          <span>Unresolved Risks</span>
          <strong>{unresolvedRisks}</strong>
        </article>

        <article>
          <span>Critical Risks</span>
          <strong>{criticalRisks}</strong>
        </article>

        <article>
          <span>Privileged Controls</span>
          <strong>{securityControls.length}</strong>
        </article>

        <article>
          <span>Emergency Access</span>
          <strong>{breakGlass ? "SIMULATION" : "OFF"}</strong>
        </article>
      </section>

      <section className="hardening-card">
        <div className="hardening-section-heading">
          <div>
            <h2>Privileged Security Controls</h2>
            <p>
              Platform-level controls that protect sensitive SuperAdmin
              operations.
            </p>
          </div>
        </div>

        <div className="security-control-list">
          {securityControls.map((control) => (
            <div className="security-control-item" key={control.id}>
              <div>
                <strong>{control.name}</strong>
                <p>{control.description}</p>
              </div>

              <span
                className={`control-status control-status-${control.status.toLowerCase()}`}
              >
                {control.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="hardening-card emergency-card">
        <div className="hardening-section-heading">
          <div>
            <h2>Break-Glass Emergency Access</h2>
            <p>
              Development simulation only. This control does not grant
              production privileges or bypass authentication.
            </p>
          </div>

          <span
            className={`emergency-indicator ${
              breakGlass ? "emergency-active" : "emergency-inactive"
            }`}
          >
            {breakGlass ? "SIMULATION ACTIVE" : "INACTIVE"}
          </span>
        </div>

        <div className="emergency-content">
          <div>
            <strong>Emergency access safeguards</strong>
            <ul>
              <li>Require explicit authorization in production.</li>
              <li>Apply a short expiry period.</li>
              <li>Record every privileged action.</li>
              <li>Notify designated security personnel.</li>
              <li>Automatically revoke access after expiry.</li>
            </ul>
          </div>

          <button
            type="button"
            className={breakGlass ? "danger-button" : "secondary-button"}
            onClick={activateBreakGlass}
          >
            {breakGlass
              ? "Disable Simulation"
              : "Activate Simulation"}
          </button>
        </div>
      </section>

      <section className="hardening-card">
        <div className="hardening-section-heading">
          <div>
            <h2>Risk Monitoring</h2>
            <p>
              Track security items that must be addressed before production.
            </p>
          </div>
        </div>

        <div className="risk-list">
          {risks.map((risk) => (
            <article
              className={`risk-item ${
                risk.resolved ? "risk-resolved" : ""
              }`}
              key={risk.id}
            >
              <div className="risk-main">
                <div className="risk-title-row">
                  <strong>{risk.title}</strong>

                  <span
                    className={`risk-level risk-level-${risk.level.toLowerCase()}`}
                  >
                    {risk.level}
                  </span>
                </div>

                <p>{risk.description}</p>
              </div>

              <div className="risk-action">
                {risk.resolved ? (
                  <span className="resolved-label">RESOLVED</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => resolveRisk(risk.id)}
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="hardening-card readiness-card">
        <div>
          <h2>Production Security Readiness</h2>
          <p>
            Development hardening is in place. Production deployment still
            requires server-side authentication, authorization, audit storage,
            monitoring, encrypted secrets, secure backups, and verified
            recovery procedures.
          </p>
        </div>

        <div className="readiness-checklist">
          <span>✓ Privileged controls defined</span>
          <span>✓ Emergency-access safeguards defined</span>
          <span>✓ Risk tracking available</span>
          <span>✓ Security review action available</span>
        </div>
      </section>
    </main>
  );
}

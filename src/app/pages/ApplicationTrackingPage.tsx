import { FormEvent, useState } from "react";
import "./ApplicationTrackingPage.css";

interface SchoolApplication {
  applicationId: string;
  schoolName: string;
  schoolType: string;
  estimatedStudents: string;
  estimatedStaff: string;
  address: string;
  state: string;
  lga: string;
  administratorName: string;
  administratorPosition: string;
  phone: string;
  email: string;
  plan: string;
  status: string;
  submittedAt: string;
}

const APPLICATION_STORAGE_KEY = "ultra-school-applications";

export default function ApplicationTrackingPage() {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [application, setApplication] =
    useState<SchoolApplication | null>(null);
  const [error, setError] = useState("");

  function goTo(path: string) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setApplication(null);

    const applications: SchoolApplication[] =
      JSON.parse(
        localStorage.getItem(
          APPLICATION_STORAGE_KEY,
        ) ?? "[]",
      );

    const normalizedReference =
      reference.trim().toUpperCase();

    const normalizedEmail =
      email.trim().toLowerCase();

    const found = applications.find(
      (item) =>
        item.applicationId.toUpperCase() ===
          normalizedReference &&
        item.email.toLowerCase() ===
          normalizedEmail,
    );

    if (!found) {
      setError(
        "No application was found with the reference and email provided.",
      );
      return;
    }

    setApplication(found);
  }

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "APPROVED":
        return "status-approved";

      case "REJECTED":
        return "status-rejected";

      case "UNDER_REVIEW":
        return "status-review";

      default:
        return "status-pending";
    }
  }

  return (
    <main className="tracking-page">
      <header className="tracking-header">
        <button
          type="button"
          className="tracking-brand"
          onClick={() => goTo("/")}
        >
          <span className="tracking-logo">FP</span>

          <span>
            <strong>ULTRA FINGERPRINT</strong>
            <small>ATTENDANCE</small>
          </span>
        </button>

        <button
          type="button"
          className="tracking-home-button"
          onClick={() => goTo("/")}
        >
          Back to Website
        </button>
      </header>

      <section className="tracking-content">
        <div className="tracking-intro">
          <p className="tracking-kicker">
            SCHOOL APPLICATION
          </p>

          <h1>Track Your Application</h1>

          <p>
            Enter your school application reference and
            registered email address to view the current
            application status.
          </p>
        </div>

        <section className="tracking-card">
          <form
            className="tracking-form"
            onSubmit={handleSubmit}
          >
            <div className="tracking-field">
              <label htmlFor="application-reference">
                Application Reference
              </label>

              <input
                id="application-reference"
                type="text"
                value={reference}
                onChange={(event) =>
                  setReference(event.target.value)
                }
                placeholder="Example: UFA-20261003-123456"
                autoComplete="off"
                required
              />
            </div>

            <div className="tracking-field">
              <label htmlFor="tracking-email">
                Registered Email
              </label>

              <input
                id="tracking-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter registered email"
                autoComplete="email"
                required
              />
            </div>

            {error && (
              <p
                className="tracking-error"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="tracking-button"
            >
              Check Application Status
            </button>
          </form>
        </section>

        {application && (
          <section className="application-result">
            <div className="result-heading">
              <div>
                <p className="tracking-kicker">
                  APPLICATION FOUND
                </p>

                <h2>{application.schoolName}</h2>
              </div>

              <span
                className={`application-status ${getStatusClass(
                  application.status,
                )}`}
              >
                {application.status.replaceAll(
                  "_",
                  " ",
                )}
              </span>
            </div>

            <div className="application-reference">
              <span>Application Reference</span>
              <strong>{application.applicationId}</strong>
            </div>

            <div className="application-details">
              <div>
                <span>School Type</span>
                <strong>{application.schoolType}</strong>
              </div>

              <div>
                <span>Location</span>
                <strong>
                  {application.lga}, {application.state}
                </strong>
              </div>

              <div>
                <span>Administrator</span>
                <strong>
                  {application.administratorName}
                </strong>
              </div>

              <div>
                <span>Requested Plan</span>
                <strong>{application.plan}</strong>
              </div>

              <div>
                <span>Submitted</span>
                <strong>
                  {formatDate(application.submittedAt)}
                </strong>
              </div>

              <div>
                <span>Contact Email</span>
                <strong>{application.email}</strong>
              </div>
            </div>

            <div className="application-message">
              {application.status ===
                "PENDING_REVIEW" && (
                <>
                  <strong>Application received</strong>
                  <p>
                    Your school registration has been
                    received and is waiting for platform
                    administration review.
                  </p>
                </>
              )}

              {application.status ===
                "UNDER_REVIEW" && (
                <>
                  <strong>Application under review</strong>
                  <p>
                    Your application is currently being
                    reviewed by the platform administration.
                  </p>
                </>
              )}

              {application.status === "APPROVED" && (
                <>
                  <strong>Application approved</strong>
                  <p>
                    Your school application has been
                    approved. Follow the account activation
                    instructions provided by the platform.
                  </p>
                </>
              )}

              {application.status === "REJECTED" && (
                <>
                  <strong>Application not approved</strong>
                  <p>
                    Your application was not approved.
                    Contact platform administration for
                    further information.
                  </p>
                </>
              )}
            </div>
          </section>
        )}

        <div className="tracking-links">
          <button
            type="button"
            onClick={() => goTo("/register-school")}
          >
            Register Another School
          </button>

          <button
            type="button"
            onClick={() => goTo("/login")}
          >
            School Login
          </button>
        </div>
      </section>

      <footer className="tracking-footer">
        <strong>ULTRA FINGERPRINT ATTENDANCE</strong>
        <span>
          Secure school attendance management.
        </span>
      </footer>
    </main>
  );
}

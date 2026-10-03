import { useMemo, useState } from "react";
import "./SchoolApplicationsPage.css";

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

interface ApplicationWithNotes
  extends SchoolApplication {
  reviewNotes?: string;
  reviewedAt?: string;
}

const STORAGE_KEY = "ultra-school-applications";

const STATUS_OPTIONS = [
  "ALL",
  "PENDING_REVIEW",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
];

export default function SchoolApplicationsPage() {
  const [applications, setApplications] = useState<
    ApplicationWithNotes[]
  >(() => {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? "[]",
      );
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");
  const [selected, setSelected] =
    useState<ApplicationWithNotes | null>(null);
  const [notes, setNotes] = useState("");

  function saveApplications(
    nextApplications: ApplicationWithNotes[],
  ) {
    setApplications(nextApplications);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nextApplications),
    );
  }

  function updateApplicationStatus(
    applicationId: string,
    status: string,
  ) {
    const now = new Date().toISOString();

    const nextApplications = applications.map(
      (application) =>
        application.applicationId === applicationId
          ? {
              ...application,
              status,
              reviewedAt: now,
              reviewNotes: notes.trim(),
            }
          : application,
    );

    saveApplications(nextApplications);

    const updated = nextApplications.find(
      (application) =>
        application.applicationId ===
        applicationId,
    );

    if (updated) {
      setSelected(updated);
      setNotes(updated.reviewNotes ?? "");
    }
  }

  function openApplication(
    application: ApplicationWithNotes,
  ) {
    setSelected(application);
    setNotes(application.reviewNotes ?? "");
  }

  function closeApplication() {
    setSelected(null);
    setNotes("");
  }

  function goTo(path: string) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  const filteredApplications = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        application.status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        application.schoolName
          .toLowerCase()
          .includes(normalizedSearch) ||
        application.applicationId
          .toLowerCase()
          .includes(normalizedSearch) ||
        application.email
          .toLowerCase()
          .includes(normalizedSearch) ||
        application.state
          .toLowerCase()
          .includes(normalizedSearch) ||
        application.lga
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [applications, search, statusFilter]);

  const pendingCount = applications.filter(
    (application) =>
      application.status === "PENDING_REVIEW",
  ).length;

  const reviewCount = applications.filter(
    (application) =>
      application.status === "UNDER_REVIEW",
  ).length;

  const approvedCount = applications.filter(
    (application) =>
      application.status === "APPROVED",
  ).length;

  function formatStatus(status: string) {
    return status.replaceAll("_", " ");
  }

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }

  return (
    <main className="applications-page">
      <section className="applications-header">
        <div>
          <p className="applications-kicker">
            SUPERADMIN
          </p>

          <h1>School Applications</h1>

          <p>
            Review and manage school registration
            applications submitted to the platform.
          </p>
        </div>

        <button
          type="button"
          className="applications-back"
          onClick={() => goTo("/")}
        >
          Platform Home
        </button>
      </section>

      <section className="application-stat-grid">
        <article>
          <span>Pending Review</span>
          <strong>{pendingCount}</strong>
        </article>

        <article>
          <span>Under Review</span>
          <strong>{reviewCount}</strong>
        </article>

        <article>
          <span>Approved</span>
          <strong>{approvedCount}</strong>
        </article>

        <article>
          <span>Total Applications</span>
          <strong>{applications.length}</strong>
        </article>
      </section>

      <section className="application-toolbar">
        <div className="application-search">
          <label htmlFor="application-search">
            Search Applications
          </label>

          <input
            id="application-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search school, reference, email, state..."
          />
        </div>

        <div className="application-filter">
          <label htmlFor="application-status-filter">
            Status
          </label>

          <select
            id="application-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="applications-table-card">
        {filteredApplications.length === 0 ? (
          <div className="applications-empty">
            <div className="empty-icon">📋</div>

            <h2>No applications found</h2>

            <p>
              Submitted school applications will appear
              here for SuperAdmin review.
            </p>
          </div>
        ) : (
          <div className="applications-table-wrapper">
            <table className="applications-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>School</th>
                  <th>Location</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredApplications.map(
                  (application) => (
                    <tr
                      key={application.applicationId}
                    >
                      <td>
                        <strong>
                          {application.applicationId}
                        </strong>
                      </td>

                      <td>
                        <strong>
                          {application.schoolName}
                        </strong>

                        <span>
                          {application.schoolType}
                        </span>
                      </td>

                      <td>
                        {application.lga},{" "}
                        {application.state}
                      </td>

                      <td>{application.plan}</td>

                      <td>
                        <span
                          className={`application-badge status-${application.status.toLowerCase()}`}
                        >
                          {formatStatus(
                            application.status,
                          )}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          application.submittedAt,
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="view-application"
                          onClick={() =>
                            openApplication(application)
                          }
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <div
          className="application-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeApplication();
            }
          }}
        >
          <section
            className="application-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-review-title"
          >
            <div className="modal-header">
              <div>
                <p className="applications-kicker">
                  APPLICATION REVIEW
                </p>

                <h2 id="application-review-title">
                  {selected.schoolName}
                </h2>

                <span>
                  {selected.applicationId}
                </span>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeApplication}
                aria-label="Close application review"
              >
                ×
              </button>
            </div>

            <div className="modal-status-row">
              <span
                className={`application-badge status-${selected.status.toLowerCase()}`}
              >
                {formatStatus(selected.status)}
              </span>
            </div>

            <div className="application-detail-grid">
              <div>
                <span>School Type</span>
                <strong>
                  {selected.schoolType}
                </strong>
              </div>

              <div>
                <span>Requested Plan</span>
                <strong>{selected.plan}</strong>
              </div>

              <div>
                <span>Estimated Students</span>
                <strong>
                  {selected.estimatedStudents}
                </strong>
              </div>

              <div>
                <span>Estimated Staff</span>
                <strong>
                  {selected.estimatedStaff}
                </strong>
              </div>

              <div>
                <span>Address</span>
                <strong>{selected.address}</strong>
              </div>

              <div>
                <span>Location</span>
                <strong>
                  {selected.lga}, {selected.state}
                </strong>
              </div>

              <div>
                <span>Administrator</span>
                <strong>
                  {selected.administratorName}
                </strong>
              </div>

              <div>
                <span>Position</span>
                <strong>
                  {selected.administratorPosition}
                </strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>{selected.phone}</strong>
              </div>

              <div>
                <span>Email</span>
                <strong>{selected.email}</strong>
              </div>

              <div>
                <span>Submitted</span>
                <strong>
                  {formatDate(
                    selected.submittedAt,
                  )}
                </strong>
              </div>

              {selected.reviewedAt && (
                <div>
                  <span>Last Reviewed</span>
                  <strong>
                    {formatDate(
                      selected.reviewedAt,
                    )}
                  </strong>
                </div>
              )}
            </div>

            <div className="review-notes">
              <label htmlFor="review-notes">
                Internal Review Notes
              </label>

              <textarea
                id="review-notes"
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                placeholder="Enter internal review notes..."
                rows={5}
              />

              <small>
                These notes are for platform
                administration and are not shown as
                public school information.
              </small>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="action-review"
                onClick={() =>
                  updateApplicationStatus(
                    selected.applicationId,
                    "UNDER_REVIEW",
                  )
                }
              >
                Mark Under Review
              </button>

              <button
                type="button"
                className="action-approve"
                onClick={() =>
                  updateApplicationStatus(
                    selected.applicationId,
                    "APPROVED",
                  )
                }
              >
                Approve
              </button>

              <button
                type="button"
                className="action-reject"
                onClick={() =>
                  updateApplicationStatus(
                    selected.applicationId,
                    "REJECTED",
                  )
                }
              >
                Reject
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

import { useMemo, useState } from "react";
import "./SuperAdminSchoolsPage.css";

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
  schoolStatus?: SchoolStatus;
  reviewNotes?: string;
}

type SchoolStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "ARCHIVED";

const STORAGE_KEY = "ultra-school-applications";

const STATUS_OPTIONS = [
  "ALL",
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "ARCHIVED",
];

export default function SuperAdminSchoolsPage() {
  const [schools, setSchools] = useState<
    SchoolApplication[]
  >(() => {
    try {
      const applications: SchoolApplication[] =
        JSON.parse(
          localStorage.getItem(STORAGE_KEY) ?? "[]",
        );

      return applications
        .filter(
          (application) =>
            application.status === "APPROVED",
        )
        .map((application) => ({
          ...application,
          schoolStatus:
            application.schoolStatus ?? "ACTIVE",
        }));
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [selectedSchool, setSelectedSchool] =
    useState<SchoolApplication | null>(null);

  const [note, setNote] = useState("");

  function persistSchools(
    nextSchools: SchoolApplication[],
  ) {
    setSchools(nextSchools);

    const allApplications: SchoolApplication[] =
      JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? "[]",
      );

    const updatedApplications =
      allApplications.map((application) => {
        const school = nextSchools.find(
          (item) =>
            item.applicationId ===
            application.applicationId,
        );

        if (!school) {
          return application;
        }

        return {
          ...application,
          schoolStatus: school.schoolStatus,
          reviewNotes: school.reviewNotes,
        };
      });

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedApplications),
    );
  }

  function changeSchoolStatus(
    applicationId: string,
    status: SchoolStatus,
  ) {
    const nextSchools = schools.map((school) =>
      school.applicationId === applicationId
        ? {
            ...school,
            schoolStatus: status,
            reviewNotes: note.trim(),
          }
        : school,
    );

    persistSchools(nextSchools);

    const updatedSchool = nextSchools.find(
      (school) =>
        school.applicationId === applicationId,
    );

    if (updatedSchool) {
      setSelectedSchool(updatedSchool);
      setNote(updatedSchool.reviewNotes ?? "");
    }
  }

  function openSchool(school: SchoolApplication) {
    setSelectedSchool(school);
    setNote(school.reviewNotes ?? "");
  }

  function closeSchool() {
    setSelectedSchool(null);
    setNote("");
  }

  function goTo(path: string) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }

  function formatStatus(value: string) {
    return value.replaceAll("_", " ");
  }

  const filteredSchools = useMemo(() => {
    const query = search.trim().toLowerCase();

    return schools.filter((school) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        school.schoolStatus === statusFilter;

      const matchesSearch =
        !query ||
        school.schoolName
          .toLowerCase()
          .includes(query) ||
        school.applicationId
          .toLowerCase()
          .includes(query) ||
        school.email
          .toLowerCase()
          .includes(query) ||
        school.state
          .toLowerCase()
          .includes(query) ||
        school.lga
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [schools, search, statusFilter]);

  const activeCount = schools.filter(
    (school) => school.schoolStatus === "ACTIVE",
  ).length;

  const inactiveCount = schools.filter(
    (school) => school.schoolStatus === "INACTIVE",
  ).length;

  const suspendedCount = schools.filter(
    (school) => school.schoolStatus === "SUSPENDED",
  ).length;

  const archivedCount = schools.filter(
    (school) => school.schoolStatus === "ARCHIVED",
  ).length;

  return (
    <main className="superadmin-schools-page">
      <section className="superadmin-schools-header">
        <div>
          <p className="superadmin-schools-kicker">
            SUPERADMIN · PLATFORM MANAGEMENT
          </p>

          <h1>Schools</h1>

          <p>
            Manage the platform registry and lifecycle
            status of approved schools.
          </p>
        </div>

        <button
          type="button"
          className="superadmin-schools-back"
          onClick={() => goTo("/school-applications")}
        >
          School Applications
        </button>
      </section>

      <section className="superadmin-school-stats">
        <article>
          <span>Active</span>
          <strong>{activeCount}</strong>
        </article>

        <article>
          <span>Inactive</span>
          <strong>{inactiveCount}</strong>
        </article>

        <article>
          <span>Suspended</span>
          <strong>{suspendedCount}</strong>
        </article>

        <article>
          <span>Archived</span>
          <strong>{archivedCount}</strong>
        </article>

        <article>
          <span>Total Schools</span>
          <strong>{schools.length}</strong>
        </article>
      </section>

      <section className="superadmin-school-toolbar">
        <div>
          <label htmlFor="school-search">
            Search Schools
          </label>

          <input
            id="school-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search school, reference, email, state..."
          />
        </div>

        <div>
          <label htmlFor="school-status">
            School Status
          </label>

          <select
            id="school-status"
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

      <section className="superadmin-schools-card">
        {filteredSchools.length === 0 ? (
          <div className="superadmin-schools-empty">
            <div className="empty-symbol">🏫</div>

            <h2>No schools found</h2>

            <p>
              Approved schools will appear here for
              platform management.
            </p>
          </div>
        ) : (
          <div className="superadmin-schools-table-wrap">
            <table className="superadmin-schools-table">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Location</th>
                  <th>Plan</th>
                  <th>Administrator</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredSchools.map((school) => (
                  <tr key={school.applicationId}>
                    <td>
                      <strong>{school.schoolName}</strong>
                      <span>
                        {school.applicationId}
                      </span>
                    </td>

                    <td>
                      {school.lga}, {school.state}
                    </td>

                    <td>{school.plan}</td>

                    <td>
                      <strong>
                        {school.administratorName}
                      </strong>
                      <span>
                        {school.administratorPosition}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`school-status-badge status-${school.schoolStatus?.toLowerCase()}`}
                      >
                        {formatStatus(
                          school.schoolStatus ?? "ACTIVE",
                        )}
                      </span>
                    </td>

                    <td>
                      {formatDate(school.submittedAt)}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="school-view-button"
                        onClick={() =>
                          openSchool(school)
                        }
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedSchool && (
        <div
          className="school-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeSchool();
            }
          }}
        >
          <section
            className="school-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="school-modal-title"
          >
            <header className="school-modal-header">
              <div>
                <p className="superadmin-schools-kicker">
                  SCHOOL MANAGEMENT
                </p>

                <h2 id="school-modal-title">
                  {selectedSchool.schoolName}
                </h2>

                <span>
                  {selectedSchool.applicationId}
                </span>
              </div>

              <button
                type="button"
                className="school-modal-close"
                onClick={closeSchool}
                aria-label="Close school management"
              >
                ×
              </button>
            </header>

            <div className="school-modal-content">
              <div className="school-current-status">
                <span>Current Status</span>

                <strong
                  className={`school-status-badge status-${selectedSchool.schoolStatus?.toLowerCase()}`}
                >
                  {formatStatus(
                    selectedSchool.schoolStatus ??
                      "ACTIVE",
                  )}
                </strong>
              </div>

              <div className="school-information-grid">
                <div>
                  <span>School Type</span>
                  <strong>
                    {selectedSchool.schoolType}
                  </strong>
                </div>

                <div>
                  <span>Subscription Plan</span>
                  <strong>
                    {selectedSchool.plan}
                  </strong>
                </div>

                <div>
                  <span>Estimated Students</span>
                  <strong>
                    {selectedSchool.estimatedStudents}
                  </strong>
                </div>

                <div>
                  <span>Estimated Staff</span>
                  <strong>
                    {selectedSchool.estimatedStaff}
                  </strong>
                </div>

                <div>
                  <span>Address</span>
                  <strong>
                    {selectedSchool.address}
                  </strong>
                </div>

                <div>
                  <span>Location</span>
                  <strong>
                    {selectedSchool.lga},{" "}
                    {selectedSchool.state}
                  </strong>
                </div>

                <div>
                  <span>Administrator</span>
                  <strong>
                    {selectedSchool.administratorName}
                  </strong>
                </div>

                <div>
                  <span>Administrator Email</span>
                  <strong>
                    {selectedSchool.email}
                  </strong>
                </div>

                <div>
                  <span>Administrator Phone</span>
                  <strong>
                    {selectedSchool.phone}
                  </strong>
                </div>

                <div>
                  <span>Registration Date</span>
                  <strong>
                    {formatDate(
                      selectedSchool.submittedAt,
                    )}
                  </strong>
                </div>
              </div>

              <div className="school-management-notes">
                <label htmlFor="school-management-notes">
                  Internal Administrative Notes
                </label>

                <textarea
                  id="school-management-notes"
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                  rows={4}
                  placeholder="Enter internal administrative notes..."
                />

                <small>
                  These notes are for platform
                  administration only.
                </small>
              </div>

              <div className="school-management-actions">
                <button
                  type="button"
                  className="school-action-active"
                  onClick={() =>
                    changeSchoolStatus(
                      selectedSchool.applicationId,
                      "ACTIVE",
                    )
                  }
                >
                  Activate
                </button>

                <button
                  type="button"
                  className="school-action-inactive"
                  onClick={() =>
                    changeSchoolStatus(
                      selectedSchool.applicationId,
                      "INACTIVE",
                    )
                  }
                >
                  Deactivate
                </button>

                <button
                  type="button"
                  className="school-action-suspend"
                  onClick={() =>
                    changeSchoolStatus(
                      selectedSchool.applicationId,
                      "SUSPENDED",
                    )
                  }
                >
                  Suspend
                </button>

                <button
                  type="button"
                  className="school-action-archive"
                  onClick={() =>
                    changeSchoolStatus(
                      selectedSchool.applicationId,
                      "ARCHIVED",
                    )
                  }
                >
                  Archive
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

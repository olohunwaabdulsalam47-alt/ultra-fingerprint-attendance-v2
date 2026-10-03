import { useEffect, useMemo, useState } from "react";
import "./TeacherAssignmentPage.css";

type AssignmentType = "CLASS_TEACHER" | "SUBJECT_TEACHER";
type AssignmentStatus = "ACTIVE" | "INACTIVE";

interface TeacherAssignment {
  assignmentId: string;
  staffId: string;
  teacherName: string;
  assignmentType: AssignmentType;
  className: string;
  subject: string;
  academicSession: string;
  term: string;
  periodsPerWeek: number;
  status: AssignmentStatus;
  createdAt: string;
}

const STORAGE_KEY = "ultra-teacher-assignments";
const STAFF_KEY = "ultra-teacher-staff-management";

const CLASS_NAMES = [
  "Nursery 1",
  "Nursery 2",
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
  "JSS 1",
  "JSS 2",
  "JSS 3",
  "SSS 1",
  "SSS 2",
  "SSS 3",
];

const SUBJECTS = [
  "English Language",
  "Mathematics",
  "Basic Science",
  "Basic Technology",
  "Social Studies",
  "Civic Education",
  "Computer Studies",
  "Agricultural Science",
  "Biology",
  "Chemistry",
  "Physics",
  "Economics",
  "Government",
  "Literature",
  "Geography",
  "Islamic Studies",
  "Christian Religious Studies",
  "Yoruba",
  "French",
  "Physical Education",
];

const SESSIONS = [
  "2026/2027",
  "2027/2028",
  "2028/2029",
];

const TERMS = [
  "First Term",
  "Second Term",
  "Third Term",
];

interface StaffOption {
  staffId: string;
  fullName: string;
  role: string;
  status: string;
}

function loadAssignments(): TeacherAssignment[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? (parsed as TeacherAssignment[])
      : [];
  } catch {
    return [];
  }
}

function loadStaff(): StaffOption[] {
  try {
    const stored = localStorage.getItem(STAFF_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (staff) =>
          staff &&
          typeof staff.staffId === "string" &&
          typeof staff.fullName === "string",
      )
      .map((staff) => ({
        staffId: staff.staffId,
        fullName: staff.fullName,
        role:
          typeof staff.role === "string"
            ? staff.role
            : "TEACHER",
        status:
          typeof staff.status === "string"
            ? staff.status
            : "ACTIVE",
      }));
  } catch {
    return [];
  }
}

function createAssignment(): TeacherAssignment {
  return {
    assignmentId: `ASN-${Date.now()}`,
    staffId: "",
    teacherName: "",
    assignmentType: "SUBJECT_TEACHER",
    className: CLASS_NAMES[0],
    subject: SUBJECTS[0],
    academicSession: SESSIONS[0],
    term: TERMS[0],
    periodsPerWeek: 5,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  };
}

export default function TeacherAssignmentPage() {
  const [assignments, setAssignments] =
    useState<TeacherAssignment[]>(loadAssignments);

  const [staff] = useState<StaffOption[]>(loadStaff);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] =
    useState("ALL");
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | AssignmentStatus>("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<TeacherAssignment | null>(null);

  const [form, setForm] =
    useState<TeacherAssignment>(createAssignment);

  const [message, setMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(assignments),
    );
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const matchesSearch =
        !query ||
        assignment.teacherName
          .toLowerCase()
          .includes(query) ||
        assignment.staffId
          .toLowerCase()
          .includes(query) ||
        assignment.className
          .toLowerCase()
          .includes(query) ||
        assignment.subject
          .toLowerCase()
          .includes(query);

      const matchesClass =
        classFilter === "ALL" ||
        assignment.className === classFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        assignment.status === statusFilter;

      return (
        matchesSearch &&
        matchesClass &&
        matchesStatus
      );
    });
  }, [
    assignments,
    search,
    classFilter,
    statusFilter,
  ]);

  const statistics = useMemo(() => {
    const active = assignments.filter(
      (assignment) => assignment.status === "ACTIVE",
    );

    const classTeachers = active.filter(
      (assignment) =>
        assignment.assignmentType === "CLASS_TEACHER",
    );

    const totalPeriods = active.reduce(
      (total, assignment) =>
        total + assignment.periodsPerWeek,
      0,
    );

    const teacherIds = new Set(
      active.map((assignment) => assignment.staffId),
    );

    return {
      total: assignments.length,
      active: active.length,
      classTeachers: classTeachers.length,
      teachersAssigned: teacherIds.size,
      periods: totalPeriods,
    };
  }, [assignments]);

  const openCreate = () => {
    setEditingAssignment(null);
    setForm(createAssignment());
    setMessage("");
    setShowForm(true);
  };

  const openEdit = (
    assignment: TeacherAssignment,
  ) => {
    setEditingAssignment(assignment);
    setForm({ ...assignment });
    setMessage("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAssignment(null);
    setForm(createAssignment());
    setMessage("");
  };

  const updateForm = <K extends keyof TeacherAssignment>(
    field: K,
    value: TeacherAssignment[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleTeacherChange = (
    staffId: string,
  ) => {
    const selected = staff.find(
      (member) => member.staffId === staffId,
    );

    setForm((current) => ({
      ...current,
      staffId,
      teacherName: selected?.fullName ?? "",
    }));
  };

  const saveAssignment = () => {
    if (!form.staffId.trim()) {
      setMessage("Please select a teacher.");
      return;
    }

    if (!form.teacherName.trim()) {
      setMessage("Teacher name is required.");
      return;
    }

    if (!form.className.trim()) {
      setMessage("Class is required.");
      return;
    }

    if (
      form.assignmentType === "SUBJECT_TEACHER" &&
      !form.subject.trim()
    ) {
      setMessage("Subject is required.");
      return;
    }

    if (
      !Number.isFinite(form.periodsPerWeek) ||
      form.periodsPerWeek < 1
    ) {
      setMessage(
        "Periods per week must be at least 1.",
      );
      return;
    }

    const duplicate = assignments.some(
      (assignment) =>
        assignment.assignmentId !==
          form.assignmentId &&
        assignment.status === "ACTIVE" &&
        form.status === "ACTIVE" &&
        assignment.staffId === form.staffId &&
        assignment.className === form.className &&
        assignment.subject === form.subject &&
        assignment.academicSession ===
          form.academicSession &&
        assignment.term === form.term,
    );

    if (duplicate) {
      setMessage(
        "This teacher already has the same active assignment for this class, subject, session and term.",
      );
      return;
    }

    const normalized: TeacherAssignment = {
      ...form,
      staffId: form.staffId.trim(),
      teacherName: form.teacherName.trim(),
      className: form.className.trim(),
      subject:
        form.assignmentType === "CLASS_TEACHER"
          ? "Class Leadership"
          : form.subject.trim(),
      periodsPerWeek: Math.max(
        1,
        Math.floor(form.periodsPerWeek),
      ),
    };

    if (editingAssignment) {
      setAssignments((current) =>
        current.map((assignment) =>
          assignment.assignmentId ===
          editingAssignment.assignmentId
            ? normalized
            : assignment,
        ),
      );

      setMessage(
        "Teacher assignment updated successfully.",
      );
    } else {
      setAssignments((current) => [
        ...current,
        normalized,
      ]);

      setMessage(
        "Teacher assignment created successfully.",
      );
    }

    window.setTimeout(closeForm, 500);
  };

  const toggleAssignment = (
    assignmentId: string,
  ) => {
    setAssignments((current) =>
      current.map((assignment) =>
        assignment.assignmentId === assignmentId
          ? {
              ...assignment,
              status:
                assignment.status === "ACTIVE"
                  ? "INACTIVE"
                  : "ACTIVE",
            }
          : assignment,
      ),
    );
  };

  const resetDevelopmentData = () => {
    setAssignments([]);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([]),
    );
    setMessage(
      "Development assignment data has been reset.",
    );
  };

  return (
    <section className="teacher-assignment-page">
      <header className="teacher-assignment-header">
        <div>
          <span className="teacher-assignment-eyebrow">
            ACADEMIC WORKLOAD
          </span>

          <h1>
            Teacher Assignment & Workload
          </h1>

          <p>
            Assign teachers to classes and subjects,
            manage class leadership and monitor weekly
            teaching workload.
          </p>
        </div>

        <button
          type="button"
          className="teacher-assignment-primary-button"
          onClick={openCreate}
        >
          + Add Assignment
        </button>
      </header>

      <div className="teacher-assignment-boundary">
        <strong>School data boundary:</strong>

        <span>
          Teacher assignments belong to the current
          school and are available only to authorized
          school administrators.
        </span>
      </div>

      <div className="teacher-assignment-stats">
        <article>
          <span>Total Assignments</span>
          <strong>{statistics.total}</strong>
          <small>All assignment records</small>
        </article>

        <article>
          <span>Active</span>
          <strong>{statistics.active}</strong>
          <small>Current assignments</small>
        </article>

        <article>
          <span>Teachers Assigned</span>
          <strong>
            {statistics.teachersAssigned}
          </strong>
          <small>Unique teachers</small>
        </article>

        <article>
          <span>Weekly Periods</span>
          <strong>{statistics.periods}</strong>
          <small>Active teaching periods</small>
        </article>
      </div>

      <div className="teacher-assignment-toolbar">
        <div>
          <label htmlFor="assignment-search">
            Search
          </label>

          <input
            id="assignment-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Teacher, staff ID, class or subject..."
          />
        </div>

        <div>
          <label htmlFor="assignment-class-filter">
            Class
          </label>

          <select
            id="assignment-class-filter"
            value={classFilter}
            onChange={(event) =>
              setClassFilter(event.target.value)
            }
          >
            <option value="ALL">All Classes</option>

            {CLASS_NAMES.map((className) => (
              <option
                key={className}
                value={className}
              >
                {className}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="assignment-status-filter">
            Status
          </label>

          <select
            id="assignment-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "ALL"
                  | AssignmentStatus,
              )
            }
          >
            <option value="ALL">
              All Statuses
            </option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">
              Inactive
            </option>
          </select>
        </div>
      </div>

      <div className="teacher-assignment-card">
        <div className="teacher-assignment-card-header">
          <div>
            <h2>Assignment Records</h2>

            <p>
              Showing {filteredAssignments.length} of{" "}
              {assignments.length} assignments.
            </p>
          </div>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="teacher-assignment-empty">
            <h3>No teacher assignments found</h3>

            <p>
              Create an assignment to connect a teacher
              with a class or subject.
            </p>

            <button
              type="button"
              className="teacher-assignment-primary-button"
              onClick={openCreate}
            >
              Create First Assignment
            </button>
          </div>
        ) : (
          <div className="teacher-assignment-table-wrap">
            <table className="teacher-assignment-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Type</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Session</th>
                  <th>Term</th>
                  <th>Periods</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredAssignments.map(
                  (assignment) => (
                    <tr
                      key={assignment.assignmentId}
                    >
                      <td>
                        <strong>
                          {assignment.teacherName}
                        </strong>
                        <small>
                          {assignment.staffId}
                        </small>
                      </td>

                      <td>
                        {assignment.assignmentType ===
                        "CLASS_TEACHER"
                          ? "Class Teacher"
                          : "Subject Teacher"}
                      </td>

                      <td>
                        {assignment.className}
                      </td>

                      <td>
                        {assignment.subject}
                      </td>

                      <td>
                        {assignment.academicSession}
                      </td>

                      <td>{assignment.term}</td>

                      <td>
                        {assignment.periodsPerWeek}
                      </td>

                      <td>
                        <span
                          className={`teacher-assignment-status ${assignment.status.toLowerCase()}`}
                        >
                          {assignment.status ===
                          "ACTIVE"
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="teacher-assignment-actions">
                          <button
                            type="button"
                            onClick={() =>
                              openEdit(
                                assignment,
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleAssignment(
                                assignment.assignmentId,
                              )
                            }
                          >
                            {assignment.status ===
                            "ACTIVE"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="teacher-assignment-workload">
        <div>
          <h2>Workload Summary</h2>
          <p>
            Active weekly teaching periods across the
            current assignment records.
          </p>
        </div>

        <strong>
          {statistics.periods} periods/week
        </strong>
      </div>

      <div className="teacher-assignment-footer">
        <span>
          Development assignments are stored in this
          browser.
        </span>

        <button
          type="button"
          className="teacher-assignment-secondary-button"
          onClick={resetDevelopmentData}
        >
          Reset Development Data
        </button>
      </div>

      {showForm && (
        <div
          className="teacher-assignment-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <div
            className="teacher-assignment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="teacher-assignment-form-title"
          >
            <div className="teacher-assignment-modal-header">
              <div>
                <span className="teacher-assignment-eyebrow">
                  TEACHER ASSIGNMENT
                </span>

                <h2 id="teacher-assignment-form-title">
                  {editingAssignment
                    ? "Edit Assignment"
                    : "Create Assignment"}
                </h2>
              </div>

              <button
                type="button"
                className="teacher-assignment-close"
                onClick={closeForm}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="teacher-assignment-form">
              <div className="teacher-assignment-form-grid">
                <div>
                  <label htmlFor="assignment-teacher">
                    Teacher
                  </label>

                  {staff.length > 0 ? (
                    <select
                      id="assignment-teacher"
                      value={form.staffId}
                      onChange={(event) =>
                        handleTeacherChange(
                          event.target.value,
                        )
                      }
                    >
                      <option value="">
                        Select teacher
                      </option>

                      {staff
                        .filter(
                          (member) =>
                            member.status ===
                            "ACTIVE",
                        )
                        .map((member) => (
                          <option
                            key={member.staffId}
                            value={member.staffId}
                          >
                            {member.fullName} —{" "}
                            {member.staffId}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <div className="teacher-assignment-no-staff">
                      No active staff records found.
                      Register teachers in Teacher &
                      Staff Management first.
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="assignment-type">
                    Assignment Type
                  </label>

                  <select
                    id="assignment-type"
                    value={form.assignmentType}
                    onChange={(event) =>
                      updateForm(
                        "assignmentType",
                        event.target.value as AssignmentType,
                      )
                    }
                  >
                    <option value="SUBJECT_TEACHER">
                      Subject Teacher
                    </option>
                    <option value="CLASS_TEACHER">
                      Class Teacher
                    </option>
                  </select>
                </div>
              </div>

              <div className="teacher-assignment-form-grid">
                <div>
                  <label htmlFor="assignment-class">
                    Class
                  </label>

                  <select
                    id="assignment-class"
                    value={form.className}
                    onChange={(event) =>
                      updateForm(
                        "className",
                        event.target.value,
                      )
                    }
                  >
                    {CLASS_NAMES.map(
                      (className) => (
                        <option
                          key={className}
                          value={className}
                        >
                          {className}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label htmlFor="assignment-subject">
                    Subject
                  </label>

                  <select
                    id="assignment-subject"
                    value={form.subject}
                    disabled={
                      form.assignmentType ===
                      "CLASS_TEACHER"
                    }
                    onChange={(event) =>
                      updateForm(
                        "subject",
                        event.target.value,
                      )
                    }
                  >
                    {form.assignmentType ===
                    "CLASS_TEACHER" ? (
                      <option value="Class Leadership">
                        Class Leadership
                      </option>
                    ) : (
                      SUBJECTS.map(
                        (subject) => (
                          <option
                            key={subject}
                            value={subject}
                          >
                            {subject}
                          </option>
                        ),
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="teacher-assignment-form-grid">
                <div>
                  <label htmlFor="assignment-session">
                    Academic Session
                  </label>

                  <select
                    id="assignment-session"
                    value={form.academicSession}
                    onChange={(event) =>
                      updateForm(
                        "academicSession",
                        event.target.value,
                      )
                    }
                  >
                    {SESSIONS.map(
                      (session) => (
                        <option
                          key={session}
                          value={session}
                        >
                          {session}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label htmlFor="assignment-term">
                    Term
                  </label>

                  <select
                    id="assignment-term"
                    value={form.term}
                    onChange={(event) =>
                      updateForm(
                        "term",
                        event.target.value,
                      )
                    }
                  >
                    {TERMS.map((term) => (
                      <option
                        key={term}
                        value={term}
                      >
                        {term}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="teacher-assignment-form-grid">
                <div>
                  <label htmlFor="assignment-periods">
                    Periods Per Week
                  </label>

                  <input
                    id="assignment-periods"
                    type="number"
                    min="1"
                    max="50"
                    value={form.periodsPerWeek}
                    onChange={(event) =>
                      updateForm(
                        "periodsPerWeek",
                        Number(event.target.value),
                      )
                    }
                  />
                </div>

                <div>
                  <label htmlFor="assignment-status">
                    Assignment Status
                  </label>

                  <select
                    id="assignment-status"
                    value={form.status}
                    onChange={(event) =>
                      updateForm(
                        "status",
                        event.target.value as AssignmentStatus,
                      )
                    }
                  >
                    <option value="ACTIVE">
                      Active
                    </option>
                    <option value="INACTIVE">
                      Inactive
                    </option>
                  </select>
                </div>
              </div>

              {message && (
                <div className="teacher-assignment-message">
                  {message}
                </div>
              )}

              <div className="teacher-assignment-modal-actions">
                <button
                  type="button"
                  className="teacher-assignment-secondary-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="teacher-assignment-primary-button"
                  onClick={saveAssignment}
                >
                  {editingAssignment
                    ? "Save Changes"
                    : "Create Assignment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import "./StudentEnrollmentPage.css";

type StudentStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "GRADUATED"
  | "TRANSFERRED";

interface StudentRecord {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  gender: "Male" | "Female" | "Not Specified";
  dateOfBirth: string;
  className: string;
  academicSession: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  address: string;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "ultra-school-student-enrollment";

const CLASS_OPTIONS = [
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

const DEFAULT_STUDENTS: StudentRecord[] = [];

function createStudentId() {
  return `STU-${Date.now()}`;
}

function createEmptyStudent(): StudentRecord {
  const now = new Date().toISOString();

  return {
    studentId: createStudentId(),
    admissionNumber: "",
    fullName: "",
    gender: "Not Specified",
    dateOfBirth: "",
    className: "Primary 1",
    academicSession: "2026/2027",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    address: "",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };
}

function loadStudents(): StudentRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return DEFAULT_STUDENTS;
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return DEFAULT_STUDENTS;
    }

    return parsed as StudentRecord[];
  } catch {
    return DEFAULT_STUDENTS;
  }
}

export default function StudentEnrollmentPage() {
  const [students, setStudents] =
    useState<StudentRecord[]>(loadStudents);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] =
    useState("ALL");
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | StudentStatus>("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] =
    useState<StudentRecord | null>(null);

  const [form, setForm] =
    useState<StudentRecord>(createEmptyStudent);

  const [message, setMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(students),
    );
  }, [students]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        student.fullName
          .toLowerCase()
          .includes(normalizedSearch) ||
        student.admissionNumber
          .toLowerCase()
          .includes(normalizedSearch) ||
        student.guardianName
          .toLowerCase()
          .includes(normalizedSearch) ||
        student.guardianPhone
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesClass =
        classFilter === "ALL" ||
        student.className === classFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        student.status === statusFilter;

      return (
        matchesSearch &&
        matchesClass &&
        matchesStatus
      );
    });
  }, [
    students,
    search,
    classFilter,
    statusFilter,
  ]);

  const statistics = useMemo(() => {
    const active = students.filter(
      (student) => student.status === "ACTIVE",
    ).length;

    const inactive = students.filter(
      (student) => student.status === "INACTIVE",
    ).length;

    const graduated = students.filter(
      (student) => student.status === "GRADUATED",
    ).length;

    const transferred = students.filter(
      (student) => student.status === "TRANSFERRED",
    ).length;

    return {
      total: students.length,
      active,
      inactive,
      graduated,
      transferred,
    };
  }, [students]);

  const openCreateForm = () => {
    setEditingStudent(null);
    setForm(createEmptyStudent());
    setMessage("");
    setShowForm(true);
  };

  const openEditForm = (student: StudentRecord) => {
    setEditingStudent(student);
    setForm({ ...student });
    setMessage("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingStudent(null);
    setForm(createEmptyStudent());
    setMessage("");
  };

  const updateForm = <K extends keyof StudentRecord>(
    field: K,
    value: StudentRecord[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveStudent = () => {
    const fullName = form.fullName.trim();
    const admissionNumber =
      form.admissionNumber.trim();

    if (!fullName) {
      setMessage("Student full name is required.");
      return;
    }

    if (!admissionNumber) {
      setMessage("Admission number is required.");
      return;
    }

    if (!form.className) {
      setMessage("Student class is required.");
      return;
    }

    if (!form.academicSession.trim()) {
      setMessage("Academic session is required.");
      return;
    }

    const duplicateAdmissionNumber =
      students.some(
        (student) =>
          student.studentId !== form.studentId &&
          student.admissionNumber
            .trim()
            .toLowerCase() ===
            admissionNumber.toLowerCase(),
      );

    if (duplicateAdmissionNumber) {
      setMessage(
        "This admission number is already assigned to another student.",
      );
      return;
    }

    if (
      form.guardianEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.guardianEmail,
      )
    ) {
      setMessage(
        "Please enter a valid guardian email address.",
      );
      return;
    }

    const now = new Date().toISOString();

    const updatedStudent: StudentRecord = {
      ...form,
      fullName,
      admissionNumber,
      academicSession:
        form.academicSession.trim(),
      guardianName: form.guardianName.trim(),
      guardianPhone: form.guardianPhone.trim(),
      guardianEmail: form.guardianEmail.trim(),
      address: form.address.trim(),
      updatedAt: now,
    };

    if (editingStudent) {
      setStudents((current) =>
        current.map((student) =>
          student.studentId ===
          updatedStudent.studentId
            ? updatedStudent
            : student,
        ),
      );

      setMessage(
        "Student record updated successfully.",
      );
    } else {
      setStudents((current) => [
        ...current,
        {
          ...updatedStudent,
          createdAt: now,
        },
      ]);

      setMessage(
        "Student enrolled successfully.",
      );
    }

    window.setTimeout(() => {
      closeForm();
    }, 500);
  };

  const updateStudentStatus = (
    studentId: string,
    status: StudentStatus,
  ) => {
    setStudents((current) =>
      current.map((student) =>
        student.studentId === studentId
          ? {
              ...student,
              status,
              updatedAt: new Date().toISOString(),
            }
          : student,
      ),
    );
  };

  const resetDevelopmentData = () => {
    setStudents(DEFAULT_STUDENTS);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(DEFAULT_STUDENTS),
    );
    setMessage(
      "Student development data has been reset.",
    );
  };

  return (
    <section className="student-enrollment-page">
      <header className="student-enrollment-header">
        <div>
          <span className="student-enrollment-eyebrow">
            SCHOOL ADMINISTRATION
          </span>

          <h1>Student Management & Enrollment</h1>

          <p>
            Register, maintain and organize student
            records within the current school.
          </p>
        </div>

        <button
          type="button"
          className="student-enrollment-primary-button"
          onClick={openCreateForm}
        >
          + Enroll Student
        </button>
      </header>

      <div className="student-enrollment-notice">
        <strong>School data boundary:</strong>

        <span>
          Student records are school-scoped and should
          only be accessible to authorized school
          administrators and staff.
        </span>
      </div>

      <div className="student-enrollment-stat-grid">
        <article className="student-enrollment-stat-card">
          <span>Total Students</span>
          <strong>{statistics.total}</strong>
          <small>Registered student records</small>
        </article>

        <article className="student-enrollment-stat-card">
          <span>Active</span>
          <strong>{statistics.active}</strong>
          <small>Currently enrolled</small>
        </article>

        <article className="student-enrollment-stat-card">
          <span>Graduated</span>
          <strong>{statistics.graduated}</strong>
          <small>Completed school enrollment</small>
        </article>

        <article className="student-enrollment-stat-card">
          <span>Transferred</span>
          <strong>{statistics.transferred}</strong>
          <small>Transferred student records</small>
        </article>
      </div>

      <div className="student-enrollment-toolbar">
        <div className="student-enrollment-search">
          <label htmlFor="student-search">
            Search students
          </label>

          <input
            id="student-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Name, admission number, guardian..."
          />
        </div>

        <div className="student-enrollment-filter">
          <label htmlFor="student-class-filter">
            Class
          </label>

          <select
            id="student-class-filter"
            value={classFilter}
            onChange={(event) =>
              setClassFilter(event.target.value)
            }
          >
            <option value="ALL">All Classes</option>

            {CLASS_OPTIONS.map((className) => (
              <option
                key={className}
                value={className}
              >
                {className}
              </option>
            ))}
          </select>
        </div>

        <div className="student-enrollment-filter">
          <label htmlFor="student-status-filter">
            Status
          </label>

          <select
            id="student-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "ALL"
                  | StudentStatus,
              )
            }
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">
              Inactive
            </option>
            <option value="GRADUATED">
              Graduated
            </option>
            <option value="TRANSFERRED">
              Transferred
            </option>
          </select>
        </div>
      </div>

      <div className="student-enrollment-table-card">
        <div className="student-enrollment-table-heading">
          <div>
            <h2>Student Records</h2>

            <p>
              Showing {filteredStudents.length} of{" "}
              {students.length} students.
            </p>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="student-enrollment-empty">
            <div className="student-enrollment-empty-icon">
              +
            </div>

            <h3>No student records found</h3>

            <p>
              Enroll a student or adjust your search
              and filters.
            </p>

            <button
              type="button"
              className="student-enrollment-primary-button"
              onClick={openCreateForm}
            >
              Enroll First Student
            </button>
          </div>
        ) : (
          <div className="student-enrollment-table-wrapper">
            <table className="student-enrollment-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Admission No.</th>
                  <th>Class</th>
                  <th>Session</th>
                  <th>Guardian</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.studentId}>
                    <td>
                      <div className="student-enrollment-name">
                        <strong>
                          {student.fullName}
                        </strong>

                        <span>
                          {student.gender}
                        </span>
                      </div>
                    </td>

                    <td>
                      {student.admissionNumber}
                    </td>

                    <td>{student.className}</td>

                    <td>
                      {student.academicSession}
                    </td>

                    <td>
                      {student.guardianName ||
                        "Not Provided"}
                    </td>

                    <td>
                      {student.guardianPhone ||
                        "Not Provided"}
                    </td>

                    <td>
                      <span
                        className={`student-enrollment-status ${student.status.toLowerCase()}`}
                      >
                        {student.status}
                      </span>
                    </td>

                    <td>
                      <div className="student-enrollment-actions">
                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(student)
                          }
                        >
                          Edit
                        </button>

                        {student.status ===
                          "ACTIVE" && (
                          <button
                            type="button"
                            onClick={() =>
                              updateStudentStatus(
                                student.studentId,
                                "INACTIVE",
                              )
                            }
                          >
                            Deactivate
                          </button>
                        )}

                        {student.status ===
                          "INACTIVE" && (
                          <button
                            type="button"
                            onClick={() =>
                              updateStudentStatus(
                                student.studentId,
                                "ACTIVE",
                              )
                            }
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="student-enrollment-footer">
        <div>
          <strong>Inactive:</strong>{" "}
          {statistics.inactive}
        </div>

        <button
          type="button"
          className="student-enrollment-secondary-button"
          onClick={resetDevelopmentData}
        >
          Reset Development Data
        </button>
      </div>

      {showForm && (
        <div
          className="student-enrollment-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <div
            className="student-enrollment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-form-title"
          >
            <div className="student-enrollment-modal-header">
              <div>
                <span className="student-enrollment-eyebrow">
                  STUDENT RECORD
                </span>

                <h2 id="student-form-title">
                  {editingStudent
                    ? "Edit Student"
                    : "Enroll Student"}
                </h2>
              </div>

              <button
                type="button"
                className="student-enrollment-close-button"
                onClick={closeForm}
                aria-label="Close student form"
              >
                ×
              </button>
            </div>

            <div className="student-enrollment-form">
              <div className="student-enrollment-form-group">
                <label htmlFor="student-full-name">
                  Full name
                </label>

                <input
                  id="student-full-name"
                  type="text"
                  value={form.fullName}
                  onChange={(event) =>
                    updateForm(
                      "fullName",
                      event.target.value,
                    )
                  }
                  placeholder="Enter student's full name"
                />
              </div>

              <div className="student-enrollment-form-grid">
                <div className="student-enrollment-form-group">
                  <label htmlFor="student-admission">
                    Admission number
                  </label>

                  <input
                    id="student-admission"
                    type="text"
                    value={form.admissionNumber}
                    onChange={(event) =>
                      updateForm(
                        "admissionNumber",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. UFA-2026-0001"
                  />
                </div>

                <div className="student-enrollment-form-group">
                  <label htmlFor="student-gender">
                    Gender
                  </label>

                  <select
                    id="student-gender"
                    value={form.gender}
                    onChange={(event) =>
                      updateForm(
                        "gender",
                        event.target.value as StudentRecord["gender"],
                      )
                    }
                  >
                    <option value="Not Specified">
                      Not Specified
                    </option>
                    <option value="Male">
                      Male
                    </option>
                    <option value="Female">
                      Female
                    </option>
                  </select>
                </div>
              </div>

              <div className="student-enrollment-form-grid">
                <div className="student-enrollment-form-group">
                  <label htmlFor="student-dob">
                    Date of birth
                  </label>

                  <input
                    id="student-dob"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(event) =>
                      updateForm(
                        "dateOfBirth",
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="student-enrollment-form-group">
                  <label htmlFor="student-class">
                    Class
                  </label>

                  <select
                    id="student-class"
                    value={form.className}
                    onChange={(event) =>
                      updateForm(
                        "className",
                        event.target.value,
                      )
                    }
                  >
                    {CLASS_OPTIONS.map(
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
              </div>

              <div className="student-enrollment-form-grid">
                <div className="student-enrollment-form-group">
                  <label htmlFor="student-session">
                    Academic session
                  </label>

                  <input
                    id="student-session"
                    type="text"
                    value={form.academicSession}
                    onChange={(event) =>
                      updateForm(
                        "academicSession",
                        event.target.value,
                      )
                    }
                    placeholder="2026/2027"
                  />
                </div>

                <div className="student-enrollment-form-group">
                  <label htmlFor="student-status">
                    Status
                  </label>

                  <select
                    id="student-status"
                    value={form.status}
                    onChange={(event) =>
                      updateForm(
                        "status",
                        event.target.value as StudentStatus,
                      )
                    }
                  >
                    <option value="ACTIVE">
                      Active
                    </option>
                    <option value="INACTIVE">
                      Inactive
                    </option>
                    <option value="GRADUATED">
                      Graduated
                    </option>
                    <option value="TRANSFERRED">
                      Transferred
                    </option>
                  </select>
                </div>
              </div>

              <div className="student-enrollment-section-title">
                Guardian / Parent Information
              </div>

              <div className="student-enrollment-form-group">
                <label htmlFor="guardian-name">
                  Guardian name
                </label>

                <input
                  id="guardian-name"
                  type="text"
                  value={form.guardianName}
                  onChange={(event) =>
                    updateForm(
                      "guardianName",
                      event.target.value,
                    )
                  }
                  placeholder="Parent or guardian name"
                />
              </div>

              <div className="student-enrollment-form-grid">
                <div className="student-enrollment-form-group">
                  <label htmlFor="guardian-phone">
                    Guardian phone
                  </label>

                  <input
                    id="guardian-phone"
                    type="tel"
                    value={form.guardianPhone}
                    onChange={(event) =>
                      updateForm(
                        "guardianPhone",
                        event.target.value,
                      )
                    }
                    placeholder="Phone number"
                  />
                </div>

                <div className="student-enrollment-form-group">
                  <label htmlFor="guardian-email">
                    Guardian email
                  </label>

                  <input
                    id="guardian-email"
                    type="email"
                    value={form.guardianEmail}
                    onChange={(event) =>
                      updateForm(
                        "guardianEmail",
                        event.target.value,
                      )
                    }
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div className="student-enrollment-form-group">
                <label htmlFor="student-address">
                  Address
                </label>

                <textarea
                  id="student-address"
                  value={form.address}
                  onChange={(event) =>
                    updateForm(
                      "address",
                      event.target.value,
                    )
                  }
                  placeholder="Student residential address"
                  rows={3}
                />
              </div>

              {message && (
                <div className="student-enrollment-form-message">
                  {message}
                </div>
              )}

              <div className="student-enrollment-modal-actions">
                <button
                  type="button"
                  className="student-enrollment-secondary-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="student-enrollment-primary-button"
                  onClick={saveStudent}
                >
                  {editingStudent
                    ? "Save Changes"
                    : "Enroll Student"}
                </button>
              </div>
            </div>

            <p className="student-enrollment-dev-note">
              Development storage: student records are
              currently stored locally in this browser.
              Production storage should use the secured
              application repository/backend.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

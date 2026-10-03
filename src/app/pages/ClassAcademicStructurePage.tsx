import { useEffect, useMemo, useState } from "react";
import "./ClassAcademicStructurePage.css";

type ClassStatus = "ACTIVE" | "INACTIVE";

type AcademicLevel =
  | "NURSERY"
  | "PRIMARY"
  | "JSS"
  | "SSS";

interface SchoolClassRecord {
  classId: string;
  name: string;
  level: AcademicLevel;
  academicSession: string;
  term: string;
  classTeacher: string;
  capacity: number;
  studentCount: number;
  status: ClassStatus;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "ultra-school-class-structure";

const DEFAULT_CLASSES: SchoolClassRecord[] = [
  {
    classId: "CLS-NUR-1",
    name: "Nursery 1",
    level: "NURSERY",
    academicSession: "2026/2027",
    term: "First Term",
    classTeacher: "Not Assigned",
    capacity: 30,
    studentCount: 0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    classId: "CLS-NUR-2",
    name: "Nursery 2",
    level: "NURSERY",
    academicSession: "2026/2027",
    term: "First Term",
    classTeacher: "Not Assigned",
    capacity: 30,
    studentCount: 0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    classId: "CLS-PRI-1",
    name: "Primary 1",
    level: "PRIMARY",
    academicSession: "2026/2027",
    term: "First Term",
    classTeacher: "Not Assigned",
    capacity: 40,
    studentCount: 0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    classId: "CLS-PRI-2",
    name: "Primary 2",
    level: "PRIMARY",
    academicSession: "2026/2027",
    term: "First Term",
    classTeacher: "Not Assigned",
    capacity: 40,
    studentCount: 0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    classId: "CLS-JSS-1",
    name: "JSS 1",
    level: "JSS",
    academicSession: "2026/2027",
    term: "First Term",
    classTeacher: "Not Assigned",
    capacity: 45,
    studentCount: 0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    classId: "CLS-JSS-2",
    name: "JSS 2",
    level: "JSS",
    academicSession: "2026/2027",
    term: "First Term",
    classTeacher: "Not Assigned",
    capacity: 45,
    studentCount: 0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    classId: "CLS-JSS-3",
    name: "JSS 3",
    level: "JSS",
    academicSession: "2026/2027",
    term: "First Term",
    classTeacher: "Not Assigned",
    capacity: 45,
    studentCount: 0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    classId: "CLS-SSS-1",
    name: "SSS 1",
    level: "SSS",
    academicSession: "2026/2027",
    term: "First Term",
    classTeacher: "Not Assigned",
    capacity: 45,
    studentCount: 0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    classId: "CLS-SSS-2",
    name: "SSS 2",
    level: "SSS",
    academicSession: "2026/2027",
    term: "First Term",
    classTeacher: "Not Assigned",
    capacity: 45,
    studentCount: 0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    classId: "CLS-SSS-3",
    name: "SSS 3",
    level: "SSS",
    academicSession: "2026/2027",
    term: "First Term",
    classTeacher: "Not Assigned",
    capacity: 45,
    studentCount: 0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const LEVEL_LABELS: Record<AcademicLevel, string> = {
  NURSERY: "Nursery",
  PRIMARY: "Primary",
  JSS: "JSS",
  SSS: "SSS",
};

function loadClasses(): SchoolClassRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return DEFAULT_CLASSES;
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return DEFAULT_CLASSES;
    }

    return parsed as SchoolClassRecord[];
  } catch {
    return DEFAULT_CLASSES;
  }
}

function createClassId(): string {
  return `CLS-${Date.now()}`;
}

function createEmptyClass(): SchoolClassRecord {
  const now = new Date().toISOString();

  return {
    classId: createClassId(),
    name: "",
    level: "PRIMARY",
    academicSession: "2026/2027",
    term: "First Term",
    classTeacher: "Not Assigned",
    capacity: 40,
    studentCount: 0,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };
}

export default function ClassAcademicStructurePage() {
  const [classes, setClasses] = useState<SchoolClassRecord[]>(loadClasses);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<"ALL" | AcademicLevel>("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | ClassStatus
  >("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] =
    useState<SchoolClassRecord | null>(null);
  const [form, setForm] = useState<SchoolClassRecord>(createEmptyClass);
  const [message, setMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
  }, [classes]);

  const filteredClasses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return classes.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.classTeacher.toLowerCase().includes(normalizedSearch) ||
        item.academicSession.toLowerCase().includes(normalizedSearch);

      const matchesLevel =
        levelFilter === "ALL" || item.level === levelFilter;

      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [classes, search, levelFilter, statusFilter]);

  const statistics = useMemo(() => {
    const active = classes.filter(
      (item) => item.status === "ACTIVE",
    ).length;

    const inactive = classes.filter(
      (item) => item.status === "INACTIVE",
    ).length;

    const students = classes.reduce(
      (total, item) => total + item.studentCount,
      0,
    );

    const capacity = classes.reduce(
      (total, item) => total + item.capacity,
      0,
    );

    return {
      total: classes.length,
      active,
      inactive,
      students,
      capacity,
      availableSeats: Math.max(capacity - students, 0),
    };
  }, [classes]);

  const openCreateForm = () => {
    setEditingClass(null);
    setForm(createEmptyClass());
    setMessage("");
    setShowForm(true);
  };

  const openEditForm = (item: SchoolClassRecord) => {
    setEditingClass(item);
    setForm({ ...item });
    setMessage("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingClass(null);
    setForm(createEmptyClass());
  };

  const updateForm = <K extends keyof SchoolClassRecord>(
    field: K,
    value: SchoolClassRecord[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveClass = () => {
    const trimmedName = form.name.trim();

    if (!trimmedName) {
      setMessage("Class name is required.");
      return;
    }

    if (!form.academicSession.trim()) {
      setMessage("Academic session is required.");
      return;
    }

    if (form.capacity < 1) {
      setMessage("Class capacity must be at least 1.");
      return;
    }

    if (form.studentCount > form.capacity) {
      setMessage(
        "Student count cannot be greater than class capacity.",
      );
      return;
    }

    const duplicate = classes.some(
      (item) =>
        item.classId !== form.classId &&
        item.name.trim().toLowerCase() ===
          trimmedName.toLowerCase() &&
        item.academicSession === form.academicSession &&
        item.term === form.term,
    );

    if (duplicate) {
      setMessage(
        "A class with this name already exists for the selected session and term.",
      );
      return;
    }

    const now = new Date().toISOString();

    const updatedRecord: SchoolClassRecord = {
      ...form,
      name: trimmedName,
      academicSession: form.academicSession.trim(),
      classTeacher: form.classTeacher.trim() || "Not Assigned",
      updatedAt: now,
    };

    if (editingClass) {
      setClasses((current) =>
        current.map((item) =>
          item.classId === updatedRecord.classId
            ? updatedRecord
            : item,
        ),
      );

      setMessage("Class updated successfully.");
    } else {
      setClasses((current) => [
        ...current,
        {
          ...updatedRecord,
          createdAt: now,
        },
      ]);

      setMessage("Class created successfully.");
    }

    window.setTimeout(() => {
      closeForm();
    }, 500);
  };

  const toggleStatus = (classId: string) => {
    setClasses((current) =>
      current.map((item) =>
        item.classId === classId
          ? {
              ...item,
              status:
                item.status === "ACTIVE"
                  ? "INACTIVE"
                  : "ACTIVE",
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
  };

  const resetDemoData = () => {
    setClasses(DEFAULT_CLASSES);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(DEFAULT_CLASSES),
    );
    setMessage("Class structure reset to development defaults.");
  };

  return (
    <section className="class-structure-page">
      <header className="class-structure-header">
        <div>
          <span className="class-structure-eyebrow">
            SCHOOL ADMINISTRATION
          </span>
          <h1>Class & Academic Structure</h1>
          <p>
            Manage the school&apos;s academic levels, classes,
            class teachers, capacity and operational status.
          </p>
        </div>

        <button
          type="button"
          className="class-structure-primary-button"
          onClick={openCreateForm}
        >
          + Add Class
        </button>
      </header>

      <div className="class-structure-notice">
        <strong>School data boundary:</strong>
        <span>
          Class records belong to the current school and are
          intended for Principal and authorized school staff
          management.
        </span>
      </div>

      <div className="class-structure-stat-grid">
        <article className="class-structure-stat-card">
          <span>Total Classes</span>
          <strong>{statistics.total}</strong>
          <small>Configured academic classes</small>
        </article>

        <article className="class-structure-stat-card">
          <span>Active Classes</span>
          <strong>{statistics.active}</strong>
          <small>Currently operational</small>
        </article>

        <article className="class-structure-stat-card">
          <span>Students</span>
          <strong>{statistics.students}</strong>
          <small>Students assigned to classes</small>
        </article>

        <article className="class-structure-stat-card">
          <span>Available Seats</span>
          <strong>{statistics.availableSeats}</strong>
          <small>
            Across configured class capacity
          </small>
        </article>
      </div>

      <div className="class-structure-toolbar">
        <div className="class-structure-search">
          <label htmlFor="class-search">Search classes</label>
          <input
            id="class-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by class, teacher or session..."
          />
        </div>

        <div className="class-structure-filter">
          <label htmlFor="level-filter">Academic level</label>
          <select
            id="level-filter"
            value={levelFilter}
            onChange={(event) =>
              setLevelFilter(
                event.target.value as
                  | "ALL"
                  | AcademicLevel,
              )
            }
          >
            <option value="ALL">All Levels</option>
            <option value="NURSERY">Nursery</option>
            <option value="PRIMARY">Primary</option>
            <option value="JSS">JSS</option>
            <option value="SSS">SSS</option>
          </select>
        </div>

        <div className="class-structure-filter">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "ALL"
                  | ClassStatus,
              )
            }
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div className="class-structure-table-card">
        <div className="class-structure-table-heading">
          <div>
            <h2>Academic Classes</h2>
            <p>
              Showing {filteredClasses.length} of{" "}
              {classes.length} classes.
            </p>
          </div>
        </div>

        {filteredClasses.length === 0 ? (
          <div className="class-structure-empty">
            <h3>No classes found</h3>
            <p>
              Adjust your filters or create a new academic
              class.
            </p>
          </div>
        ) : (
          <div className="class-structure-table-wrapper">
            <table className="class-structure-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Level</th>
                  <th>Session</th>
                  <th>Term</th>
                  <th>Teacher</th>
                  <th>Students</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredClasses.map((item) => {
                  const occupancy =
                    item.capacity > 0
                      ? Math.min(
                          Math.round(
                            (item.studentCount /
                              item.capacity) *
                              100,
                          ),
                          100,
                        )
                      : 0;

                  return (
                    <tr key={item.classId}>
                      <td>
                        <strong>{item.name}</strong>
                      </td>

                      <td>
                        <span className="class-structure-level">
                          {LEVEL_LABELS[item.level]}
                        </span>
                      </td>

                      <td>{item.academicSession}</td>

                      <td>{item.term}</td>

                      <td>{item.classTeacher}</td>

                      <td>
                        <div className="class-structure-capacity">
                          <strong>
                            {item.studentCount}
                          </strong>
                          <span>
                            {occupancy}% occupied
                          </span>
                        </div>
                      </td>

                      <td>{item.capacity}</td>

                      <td>
                        <span
                          className={`class-structure-status ${
                            item.status === "ACTIVE"
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td>
                        <div className="class-structure-actions">
                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(item)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleStatus(item.classId)
                            }
                          >
                            {item.status === "ACTIVE"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="class-structure-footer">
        <div>
          <strong>Inactive classes:</strong>{" "}
          {statistics.inactive}
        </div>

        <button
          type="button"
          className="class-structure-secondary-button"
          onClick={resetDemoData}
        >
          Reset Development Data
        </button>
      </div>

      {showForm && (
        <div
          className="class-structure-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <div
            className="class-structure-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="class-form-title"
          >
            <div className="class-structure-modal-header">
              <div>
                <span className="class-structure-eyebrow">
                  ACADEMIC STRUCTURE
                </span>
                <h2 id="class-form-title">
                  {editingClass
                    ? "Edit Class"
                    : "Create Class"}
                </h2>
              </div>

              <button
                type="button"
                className="class-structure-close-button"
                onClick={closeForm}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="class-structure-form">
              <div className="class-structure-form-group">
                <label htmlFor="class-name">
                  Class name
                </label>
                <input
                  id="class-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateForm("name", event.target.value)
                  }
                  placeholder="e.g. Primary 3"
                />
              </div>

              <div className="class-structure-form-grid">
                <div className="class-structure-form-group">
                  <label htmlFor="class-level">
                    Academic level
                  </label>
                  <select
                    id="class-level"
                    value={form.level}
                    onChange={(event) =>
                      updateForm(
                        "level",
                        event.target.value as AcademicLevel,
                      )
                    }
                  >
                    <option value="NURSERY">
                      Nursery
                    </option>
                    <option value="PRIMARY">
                      Primary
                    </option>
                    <option value="JSS">JSS</option>
                    <option value="SSS">SSS</option>
                  </select>
                </div>

                <div className="class-structure-form-group">
                  <label htmlFor="class-session">
                    Academic session
                  </label>
                  <input
                    id="class-session"
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
              </div>

              <div className="class-structure-form-grid">
                <div className="class-structure-form-group">
                  <label htmlFor="class-term">Term</label>
                  <select
                    id="class-term"
                    value={form.term}
                    onChange={(event) =>
                      updateForm("term", event.target.value)
                    }
                  >
                    <option value="First Term">
                      First Term
                    </option>
                    <option value="Second Term">
                      Second Term
                    </option>
                    <option value="Third Term">
                      Third Term
                    </option>
                  </select>
                </div>

                <div className="class-structure-form-group">
                  <label htmlFor="class-teacher">
                    Class teacher
                  </label>
                  <input
                    id="class-teacher"
                    type="text"
                    value={form.classTeacher}
                    onChange={(event) =>
                      updateForm(
                        "classTeacher",
                        event.target.value,
                      )
                    }
                    placeholder="Teacher name"
                  />
                </div>
              </div>

              <div className="class-structure-form-grid">
                <div className="class-structure-form-group">
                  <label htmlFor="class-capacity">
                    Capacity
                  </label>
                  <input
                    id="class-capacity"
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(event) =>
                      updateForm(
                        "capacity",
                        Number(event.target.value),
                      )
                    }
                  />
                </div>

                <div className="class-structure-form-group">
                  <label htmlFor="class-students">
                    Current students
                  </label>
                  <input
                    id="class-students"
                    type="number"
                    min="0"
                    value={form.studentCount}
                    onChange={(event) =>
                      updateForm(
                        "studentCount",
                        Number(event.target.value),
                      )
                    }
                  />
                </div>
              </div>

              <div className="class-structure-form-group">
                <label htmlFor="class-status">Status</label>
                <select
                  id="class-status"
                  value={form.status}
                  onChange={(event) =>
                    updateForm(
                      "status",
                      event.target.value as ClassStatus,
                    )
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">
                    Inactive
                  </option>
                </select>
              </div>

              {message && (
                <div className="class-structure-form-message">
                  {message}
                </div>
              )}

              <div className="class-structure-modal-actions">
                <button
                  type="button"
                  className="class-structure-secondary-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="class-structure-primary-button"
                  onClick={saveClass}
                >
                  {editingClass
                    ? "Save Changes"
                    : "Create Class"}
                </button>
              </div>
            </div>

            <p className="class-structure-dev-note">
              Development storage: class configuration is
              currently stored locally in this browser.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

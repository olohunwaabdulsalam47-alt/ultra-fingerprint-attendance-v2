import { useEffect, useMemo, useState } from "react";
import "./TeacherStaffManagementPage.css";

type StaffRole =
  | "TEACHER"
  | "PRINCIPAL"
  | "VICE_PRINCIPAL"
  | "ADMINISTRATOR"
  | "ACCOUNTANT"
  | "SUPPORT_STAFF";

type StaffStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE";

interface StaffRecord {
  staffId: string;
  fullName: string;
  role: StaffRole;
  department: string;
  classAssignment: string;
  phone: string;
  email: string;
  address: string;
  dateJoined: string;
  status: StaffStatus;
}

const STORAGE_KEY = "ultra-teacher-staff-management";

const CLASS_NAMES = [
  "Not Assigned",
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

const DEFAULT_STAFF: StaffRecord[] = [];

const ROLE_LABELS: Record<StaffRole, string> = {
  TEACHER: "Teacher",
  PRINCIPAL: "Principal",
  VICE_PRINCIPAL: "Vice Principal",
  ADMINISTRATOR: "Administrator",
  ACCOUNTANT: "Accountant",
  SUPPORT_STAFF: "Support Staff",
};

const STATUS_LABELS: Record<StaffStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ON_LEAVE: "On Leave",
};

function loadStaff(): StaffRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return DEFAULT_STAFF;
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? (parsed as StaffRecord[])
      : DEFAULT_STAFF;
  } catch {
    return DEFAULT_STAFF;
  }
}

function createStaff(): StaffRecord {
  return {
    staffId: `STF-${Date.now()}`,
    fullName: "",
    role: "TEACHER",
    department: "",
    classAssignment: "Not Assigned",
    phone: "",
    email: "",
    address: "",
    dateJoined: new Date().toISOString().slice(0, 10),
    status: "ACTIVE",
  };
}

export default function TeacherStaffManagementPage() {
  const [staff, setStaff] = useState<StaffRecord[]>(loadStaff);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "ALL" | StaffRole
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | StaffStatus
  >("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] =
    useState<StaffRecord | null>(null);
  const [form, setForm] = useState<StaffRecord>(createStaff);
  const [message, setMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(staff));
  }, [staff]);

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();

    return staff.filter((member) => {
      const matchesSearch =
        !query ||
        member.staffId.toLowerCase().includes(query) ||
        member.fullName.toLowerCase().includes(query) ||
        member.department.toLowerCase().includes(query) ||
        member.classAssignment
          .toLowerCase()
          .includes(query) ||
        member.phone.includes(query) ||
        member.email.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "ALL" ||
        member.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        member.status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [staff, search, roleFilter, statusFilter]);

  const statistics = useMemo(() => {
    return {
      total: staff.length,
      teachers: staff.filter(
        (member) => member.role === "TEACHER",
      ).length,
      active: staff.filter(
        (member) => member.status === "ACTIVE",
      ).length,
      onLeave: staff.filter(
        (member) => member.status === "ON_LEAVE",
      ).length,
    };
  }, [staff]);

  const openCreate = () => {
    setEditingStaff(null);
    setForm(createStaff());
    setMessage("");
    setShowForm(true);
  };

  const openEdit = (member: StaffRecord) => {
    setEditingStaff(member);
    setForm({ ...member });
    setMessage("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingStaff(null);
    setForm(createStaff());
    setMessage("");
  };

  const updateForm = <K extends keyof StaffRecord>(
    field: K,
    value: StaffRecord[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveStaff = () => {
    if (!form.staffId.trim()) {
      setMessage("Staff ID is required.");
      return;
    }

    if (!form.fullName.trim()) {
      setMessage("Staff full name is required.");
      return;
    }

    if (!form.phone.trim()) {
      setMessage("Staff phone number is required.");
      return;
    }

    if (!form.dateJoined) {
      setMessage("Date joined is required.");
      return;
    }

    const duplicateStaffId = staff.some(
      (member) =>
        member.staffId !== form.staffId &&
        member.staffId.trim().toLowerCase() ===
          form.staffId.trim().toLowerCase(),
    );

    if (duplicateStaffId) {
      setMessage(
        "This Staff ID is already assigned to another staff member.",
      );
      return;
    }

    const normalizedStaff: StaffRecord = {
      ...form,
      staffId: form.staffId.trim(),
      fullName: form.fullName.trim(),
      department: form.department.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    };

    if (editingStaff) {
      setStaff((current) =>
        current.map((member) =>
          member.staffId === form.staffId
            ? normalizedStaff
            : member,
        ),
      );

      setMessage("Staff record updated successfully.");
    } else {
      setStaff((current) => [
        ...current,
        normalizedStaff,
      ]);

      setMessage("Staff member registered successfully.");
    }

    window.setTimeout(closeForm, 500);
  };

  const toggleStatus = (staffId: string) => {
    setStaff((current) =>
      current.map((member) => {
        if (member.staffId !== staffId) {
          return member;
        }

        return {
          ...member,
          status:
            member.status === "ACTIVE"
              ? "INACTIVE"
              : "ACTIVE",
        };
      }),
    );
  };

  const resetDevelopmentData = () => {
    setStaff(DEFAULT_STAFF);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(DEFAULT_STAFF),
    );
    setMessage("Development staff data has been reset.");
  };

  return (
    <section className="teacher-staff-page">
      <header className="teacher-staff-header">
        <div>
          <span className="teacher-staff-eyebrow">
            SCHOOL ADMINISTRATION
          </span>

          <h1>Teacher & Staff Management</h1>

          <p>
            Register staff, assign school roles, manage
            class responsibilities and maintain staff
            employment status.
          </p>
        </div>

        <button
          type="button"
          className="teacher-staff-primary-button"
          onClick={openCreate}
        >
          + Add Staff
        </button>
      </header>

      <div className="teacher-staff-boundary-notice">
        <strong>School data boundary:</strong>

        <span>
          Staff records belong to the current school and
          are available only to authorized school
          administrators.
        </span>
      </div>

      <div className="teacher-staff-stat-grid">
        <article className="teacher-staff-stat-card">
          <span>Total Staff</span>
          <strong>{statistics.total}</strong>
          <small>All registered staff</small>
        </article>

        <article className="teacher-staff-stat-card">
          <span>Teachers</span>
          <strong>{statistics.teachers}</strong>
          <small>Teaching staff</small>
        </article>

        <article className="teacher-staff-stat-card">
          <span>Active Staff</span>
          <strong>{statistics.active}</strong>
          <small>Currently active</small>
        </article>

        <article className="teacher-staff-stat-card">
          <span>On Leave</span>
          <strong>{statistics.onLeave}</strong>
          <small>Currently on leave</small>
        </article>
      </div>

      <div className="teacher-staff-toolbar">
        <div className="teacher-staff-search">
          <label htmlFor="staff-search">
            Search staff
          </label>

          <input
            id="staff-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Name, Staff ID, department, class..."
          />
        </div>

        <div className="teacher-staff-filter">
          <label htmlFor="staff-role-filter">
            Role
          </label>

          <select
            id="staff-role-filter"
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value as
                  | "ALL"
                  | StaffRole,
              )
            }
          >
            <option value="ALL">All Roles</option>

            {Object.entries(ROLE_LABELS).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="teacher-staff-filter">
          <label htmlFor="staff-status-filter">
            Status
          </label>

          <select
            id="staff-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "ALL"
                  | StaffStatus,
              )
            }
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ON_LEAVE">On Leave</option>
          </select>
        </div>
      </div>

      <div className="teacher-staff-table-card">
        <div className="teacher-staff-table-heading">
          <div>
            <h2>Staff Records</h2>

            <p>
              Showing {filteredStaff.length} of{" "}
              {staff.length} staff records.
            </p>
          </div>
        </div>

        {filteredStaff.length === 0 ? (
          <div className="teacher-staff-empty">
            <h3>No staff records found</h3>

            <p>
              Add a teacher or staff member to begin
              managing the school workforce.
            </p>

            <button
              type="button"
              className="teacher-staff-primary-button"
              onClick={openCreate}
            >
              Add First Staff Member
            </button>
          </div>
        ) : (
          <div className="teacher-staff-table-wrapper">
            <table className="teacher-staff-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Staff ID</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Class</th>
                  <th>Phone</th>
                  <th>Date Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStaff.map((member) => (
                  <tr key={member.staffId}>
                    <td>
                      <strong>{member.fullName}</strong>
                    </td>

                    <td>{member.staffId}</td>

                    <td>
                      {ROLE_LABELS[member.role]}
                    </td>

                    <td>
                      {member.department ||
                        "Not Assigned"}
                    </td>

                    <td>
                      {member.classAssignment}
                    </td>

                    <td>{member.phone}</td>

                    <td>{member.dateJoined}</td>

                    <td>
                      <span
                        className={`teacher-staff-status ${member.status.toLowerCase()}`}
                      >
                        {STATUS_LABELS[member.status]}
                      </span>
                    </td>

                    <td>
                      <div className="teacher-staff-actions">
                        <button
                          type="button"
                          onClick={() =>
                            openEdit(member)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleStatus(
                              member.staffId,
                            )
                          }
                        >
                          {member.status === "ACTIVE"
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="teacher-staff-footer">
        <span>
          Development records are currently stored in
          this browser.
        </span>

        <button
          type="button"
          className="teacher-staff-secondary-button"
          onClick={resetDevelopmentData}
        >
          Reset Development Data
        </button>
      </div>

      {showForm && (
        <div
          className="teacher-staff-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <div
            className="teacher-staff-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-form-title"
          >
            <div className="teacher-staff-modal-header">
              <div>
                <span className="teacher-staff-eyebrow">
                  STAFF RECORD
                </span>

                <h2 id="staff-form-title">
                  {editingStaff
                    ? "Edit Staff"
                    : "Register Staff"}
                </h2>
              </div>

              <button
                type="button"
                className="teacher-staff-close-button"
                onClick={closeForm}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="teacher-staff-form">
              <div className="teacher-staff-form-grid">
                <div className="teacher-staff-form-group">
                  <label htmlFor="staff-id">
                    Staff ID
                  </label>

                  <input
                    id="staff-id"
                    type="text"
                    value={form.staffId}
                    onChange={(event) =>
                      updateForm(
                        "staffId",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. STF-001"
                  />
                </div>

                <div className="teacher-staff-form-group">
                  <label htmlFor="staff-name">
                    Full name
                  </label>

                  <input
                    id="staff-name"
                    type="text"
                    value={form.fullName}
                    onChange={(event) =>
                      updateForm(
                        "fullName",
                        event.target.value,
                      )
                    }
                    placeholder="Staff full name"
                  />
                </div>
              </div>

              <div className="teacher-staff-form-grid">
                <div className="teacher-staff-form-group">
                  <label htmlFor="staff-role">
                    Role
                  </label>

                  <select
                    id="staff-role"
                    value={form.role}
                    onChange={(event) =>
                      updateForm(
                        "role",
                        event.target.value as StaffRole,
                      )
                    }
                  >
                    {Object.entries(ROLE_LABELS).map(
                      ([value, label]) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="teacher-staff-form-group">
                  <label htmlFor="staff-department">
                    Department
                  </label>

                  <input
                    id="staff-department"
                    type="text"
                    value={form.department}
                    onChange={(event) =>
                      updateForm(
                        "department",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Science"
                  />
                </div>
              </div>

              <div className="teacher-staff-form-grid">
                <div className="teacher-staff-form-group">
                  <label htmlFor="staff-class">
                    Class assignment
                  </label>

                  <select
                    id="staff-class"
                    value={form.classAssignment}
                    onChange={(event) =>
                      updateForm(
                        "classAssignment",
                        event.target.value,
                      )
                    }
                  >
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

                <div className="teacher-staff-form-group">
                  <label htmlFor="staff-date-joined">
                    Date joined
                  </label>

                  <input
                    id="staff-date-joined"
                    type="date"
                    value={form.dateJoined}
                    onChange={(event) =>
                      updateForm(
                        "dateJoined",
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>

              <div className="teacher-staff-form-grid">
                <div className="teacher-staff-form-group">
                  <label htmlFor="staff-phone">
                    Phone
                  </label>

                  <input
                    id="staff-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateForm(
                        "phone",
                        event.target.value,
                      )
                    }
                    placeholder="080..."
                  />
                </div>

                <div className="teacher-staff-form-group">
                  <label htmlFor="staff-email">
                    Email
                  </label>

                  <input
                    id="staff-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateForm(
                        "email",
                        event.target.value,
                      )
                    }
                    placeholder="staff@example.com"
                  />
                </div>
              </div>

              <div className="teacher-staff-form-group">
                <label htmlFor="staff-address">
                  Address
                </label>

                <textarea
                  id="staff-address"
                  rows={3}
                  value={form.address}
                  onChange={(event) =>
                    updateForm(
                      "address",
                      event.target.value,
                    )
                  }
                  placeholder="Residential address"
                />
              </div>

              <div className="teacher-staff-form-group">
                <label htmlFor="staff-status">
                  Employment status
                </label>

                <select
                  id="staff-status"
                  value={form.status}
                  onChange={(event) =>
                    updateForm(
                      "status",
                      event.target.value as StaffStatus,
                    )
                  }
                >
                  <option value="ACTIVE">
                    Active
                  </option>
                  <option value="INACTIVE">
                    Inactive
                  </option>
                  <option value="ON_LEAVE">
                    On Leave
                  </option>
                </select>
              </div>

              {message && (
                <div className="teacher-staff-form-message">
                  {message}
                </div>
              )}

              <div className="teacher-staff-modal-actions">
                <button
                  type="button"
                  className="teacher-staff-secondary-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="teacher-staff-primary-button"
                  onClick={saveStaff}
                >
                  {editingStaff
                    ? "Save Changes"
                    : "Register Staff"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

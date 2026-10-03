import { useMemo, useState } from "react";
import "./SuperAdminUsersPage.css";

type PlatformRole =
  | "SUPER_ADMIN"
  | "PLATFORM_ADMIN"
  | "PLATFORM_SUPPORT"
  | "PLATFORM_FINANCE"
  | "PLATFORM_AUDITOR";

type UserStatus = "ACTIVE" | "INACTIVE";

interface PlatformUser {
  userId: string;
  staffId: string;
  name: string;
  email: string;
  phone: string;
  role: PlatformRole;
  status: UserStatus;
  lastLogin: string;
  createdAt: string;
}

const STORAGE_KEY = "ultra-platform-users";

const DEMO_USERS: PlatformUser[] = [
  {
    userId: "PU-0001",
    staffId: "UFA-SA-001",
    name: "Platform Super Administrator",
    email: "superadmin@ultrafingerprint.com",
    phone: "+234 800 000 0001",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    lastLogin: "Not recorded",
    createdAt: "2026-10-01T08:00:00.000Z",
  },
];

const ROLE_LABELS: Record<PlatformRole, string> = {
  SUPER_ADMIN: "Super Admin",
  PLATFORM_ADMIN: "Platform Admin",
  PLATFORM_SUPPORT: "Platform Support",
  PLATFORM_FINANCE: "Platform Finance",
  PLATFORM_AUDITOR: "Platform Auditor",
};

function loadUsers(): PlatformUser[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEMO_USERS),
      );
      return DEMO_USERS;
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return DEMO_USERS;
    }

    return parsed as PlatformUser[];
  } catch {
    return DEMO_USERS;
  }
}

function saveUsers(users: PlatformUser[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(users),
  );
}

function formatDate(value: string) {
  if (!value || value === "Not recorded") {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function generateUserId(users: PlatformUser[]) {
  return `PU-${String(users.length + 1).padStart(4, "0")}`;
}

function generateStaffId(users: PlatformUser[]) {
  return `UFA-PS-${String(users.length + 1).padStart(3, "0")}`;
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>(
    loadUsers,
  );

  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState<
    "ALL" | PlatformRole
  >("ALL");

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | UserStatus
  >("ALL");

  const [selectedUser, setSelectedUser] =
    useState<PlatformUser | null>(null);

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [message, setMessage] = useState("");

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [newRole, setNewRole] =
    useState<PlatformRole>("PLATFORM_ADMIN");

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query) ||
        user.staffId.toLowerCase().includes(query) ||
        user.userId.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "ALL" ||
        user.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        user.status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  const activeCount = users.filter(
    (user) => user.status === "ACTIVE",
  ).length;

  const inactiveCount = users.filter(
    (user) => user.status === "INACTIVE",
  ).length;

  const superAdminCount = users.filter(
    (user) => user.role === "SUPER_ADMIN",
  ).length;

  function updateUsers(nextUsers: PlatformUser[]) {
    setUsers(nextUsers);
    saveUsers(nextUsers);
  }

  function toggleStatus(userId: string) {
    const nextUsers: PlatformUser[] = users.map(
      (user): PlatformUser => {
        if (user.userId !== userId) {
          return user;
        }

        const nextStatus: UserStatus =
          user.status === "ACTIVE"
            ? "INACTIVE"
            : "ACTIVE";

        return {
          ...user,
          status: nextStatus,
        };
      },
    );

    updateUsers(nextUsers);

    const updatedUser = nextUsers.find(
      (user) => user.userId === userId,
    );

    if (updatedUser) {
      setSelectedUser(updatedUser);

      setMessage(
        `${updatedUser.name} is now ${updatedUser.status.toLowerCase()}.`,
      );
    }
  }

  function updateRole(
    userId: string,
    role: PlatformRole,
  ) {
    const nextUsers: PlatformUser[] = users.map(
      (user): PlatformUser =>
        user.userId === userId
          ? { ...user, role }
          : user,
    );

    updateUsers(nextUsers);

    const updatedUser = nextUsers.find(
      (user) => user.userId === userId,
    );

    if (updatedUser) {
      setSelectedUser(updatedUser);

      setMessage(
        `Role updated to ${ROLE_LABELS[role]}.`,
      );
    }
  }

  function resetForm() {
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewRole("PLATFORM_ADMIN");
  }

  function createUser() {
    const name = newName.trim();
    const email = newEmail.trim();
    const phone = newPhone.trim();

    if (!name || !email) {
      setMessage(
        "Name and email address are required.",
      );
      return;
    }

    const emailExists = users.some(
      (user) =>
        user.email.toLowerCase() ===
        email.toLowerCase(),
    );

    if (emailExists) {
      setMessage(
        "A platform user with this email already exists.",
      );
      return;
    }

    const now = new Date().toISOString();

    const newUser: PlatformUser = {
      userId: generateUserId(users),
      staffId: generateStaffId(users),
      name,
      email,
      phone,
      role: newRole,
      status: "ACTIVE",
      lastLogin: "Not recorded",
      createdAt: now,
    };

    const nextUsers: PlatformUser[] = [
      ...users,
      newUser,
    ];

    updateUsers(nextUsers);

    setShowCreateModal(false);
    setSelectedUser(newUser);
    resetForm();

    setMessage(
      "Platform user created successfully.",
    );
  }

  return (
    <section className="superadmin-users-page">
      <header className="superadmin-users-header">
        <div>
          <p className="page-eyebrow">
            PLATFORM ADMINISTRATION
          </p>

          <h1>Platform Users & Roles</h1>

          <p>
            Manage users who administer and support the
            ULTRA FINGERPRINT ATTENDANCE platform.
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() => {
            setMessage("");
            setShowCreateModal(true);
          }}
        >
          + Add Platform User
        </button>
      </header>

      {message && (
        <div className="users-message">
          {message}
        </div>
      )}

      <div className="users-stat-grid">
        <article className="users-stat-card">
          <span>Total Platform Users</span>
          <strong>{users.length}</strong>
        </article>

        <article className="users-stat-card">
          <span>Active Users</span>
          <strong>{activeCount}</strong>
        </article>

        <article className="users-stat-card">
          <span>Inactive Users</span>
          <strong>{inactiveCount}</strong>
        </article>

        <article className="users-stat-card">
          <span>Super Admins</span>
          <strong>{superAdminCount}</strong>
        </article>
      </div>

      <div className="users-toolbar">
        <input
          type="search"
          placeholder="Search by name, email, staff ID..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          value={roleFilter}
          onChange={(event) =>
            setRoleFilter(
              event.target.value as
                | "ALL"
                | PlatformRole,
            )
          }
        >
          <option value="ALL">All roles</option>

          {Object.entries(ROLE_LABELS).map(
            ([role, label]) => (
              <option key={role} value={role}>
                {label}
              </option>
            ),
          )}
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as
                | "ALL"
                | UserStatus,
            )
          }
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="users-table-card">
        <div className="table-heading">
          <div>
            <h2>Platform Staff</h2>

            <span>
              {filteredUsers.length} user
              {filteredUsers.length === 1
                ? ""
                : "s"} found
            </span>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-users">
            <strong>
              No platform users found
            </strong>

            <p>
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Staff ID</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.userId}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {user.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {user.name}
                          </strong>

                          <span>
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>{user.staffId}</td>

                    <td>
                      <span className="role-badge">
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${user.status.toLowerCase()}`}
                      >
                        {user.status}
                      </span>
                    </td>

                    <td>
                      {formatDate(user.lastLogin)}
                    </td>

                    <td>
                      {formatDate(user.createdAt)}
                    </td>

                    <td>
                      <button
                        className="view-button"
                        type="button"
                        onClick={() =>
                          setSelectedUser(user)
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="modal-backdrop">
          <div className="users-modal">
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">
                  PLATFORM USER
                </p>

                <h2>{selectedUser.name}</h2>
              </div>

              <button
                className="close-button"
                type="button"
                onClick={() =>
                  setSelectedUser(null)
                }
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="profile-summary">
              <div className="large-avatar">
                {selectedUser.name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {selectedUser.name}
                </strong>

                <span>
                  {selectedUser.email}
                </span>

                <span>
                  {selectedUser.phone ||
                    "No phone"}
                </span>
              </div>
            </div>

            <div className="user-details-grid">
              <div>
                <span>User ID</span>
                <strong>
                  {selectedUser.userId}
                </strong>
              </div>

              <div>
                <span>Staff ID</span>
                <strong>
                  {selectedUser.staffId}
                </strong>
              </div>

              <div>
                <span>Created</span>
                <strong>
                  {formatDate(
                    selectedUser.createdAt,
                  )}
                </strong>
              </div>

              <div>
                <span>Last Login</span>
                <strong>
                  {formatDate(
                    selectedUser.lastLogin,
                  )}
                </strong>
              </div>
            </div>

            <div className="modal-section">
              <label htmlFor="platform-role">
                Platform Role
              </label>

              <select
                id="platform-role"
                value={selectedUser.role}
                onChange={(event) =>
                  updateRole(
                    selectedUser.userId,
                    event.target
                      .value as PlatformRole,
                  )
                }
              >
                {Object.entries(ROLE_LABELS).map(
                  ([role, label]) => (
                    <option
                      key={role}
                      value={role}
                    >
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="modal-section">
              <span className="detail-label">
                Account Status
              </span>

              <span
                className={`status-badge ${selectedUser.status.toLowerCase()}`}
              >
                {selectedUser.status}
              </span>
            </div>

            <div className="modal-actions">
              <button
                className={
                  selectedUser.status === "ACTIVE"
                    ? "danger-button"
                    : "primary-button"
                }
                type="button"
                onClick={() =>
                  toggleStatus(
                    selectedUser.userId,
                  )
                }
              >
                {selectedUser.status === "ACTIVE"
                  ? "Deactivate Account"
                  : "Reactivate Account"}
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  setSelectedUser(null)
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="users-modal create-user-modal">
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">
                  PLATFORM ADMINISTRATION
                </p>

                <h2>Add Platform User</h2>
              </div>

              <button
                className="close-button"
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              <label>
                Full Name

                <input
                  type="text"
                  value={newName}
                  onChange={(event) =>
                    setNewName(event.target.value)
                  }
                  placeholder="Enter full name"
                />
              </label>

              <label>
                Email Address

                <input
                  type="email"
                  value={newEmail}
                  onChange={(event) =>
                    setNewEmail(event.target.value)
                  }
                  placeholder="name@example.com"
                />
              </label>

              <label>
                Phone Number

                <input
                  type="tel"
                  value={newPhone}
                  onChange={(event) =>
                    setNewPhone(event.target.value)
                  }
                  placeholder="+234..."
                />
              </label>

              <label>
                Platform Role

                <select
                  value={newRole}
                  onChange={(event) =>
                    setNewRole(
                      event.target
                        .value as PlatformRole,
                    )
                  }
                >
                  {Object.entries(ROLE_LABELS)
                    .filter(
                      ([role]) =>
                        role !== "SUPER_ADMIN",
                    )
                    .map(([role, label]) => (
                      <option
                        key={role}
                        value={role}
                      >
                        {label}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            <div className="modal-note">
              New accounts are created as active
              platform accounts. Authentication and
              password management will be connected to
              the secure identity system in a later
              security batch.
            </div>

            <div className="modal-actions">
              <button
                className="primary-button"
                type="button"
                onClick={createUser}
              >
                Create Platform User
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

import { useMemo, useState } from "react";
import "./SuperAdminUsersPage.css";

type PlatformRole =
  | "SUPER_ADMIN"
  | "PLATFORM_ADMIN"
  | "PLATFORM_SUPPORT"
  | "PLATFORM_FINANCE"
  | "PLATFORM_AUDITOR";

type ManagedPlatformRole = Exclude<
  PlatformRole,
  "SUPER_ADMIN"
>;

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

const PROTECTED_SUPER_ADMIN_ID = "PU-0001";
const PROTECTED_SUPER_ADMIN_STAFF_ID = "UFA-SA-001";

const DEMO_USERS: PlatformUser[] = [
  {
    userId: PROTECTED_SUPER_ADMIN_ID,
    staffId: PROTECTED_SUPER_ADMIN_STAFF_ID,
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

const MANAGED_ROLE_LABELS: Record<
  ManagedPlatformRole,
  string
> = {
  PLATFORM_ADMIN: "Platform Admin",
  PLATFORM_SUPPORT: "Platform Support",
  PLATFORM_FINANCE: "Platform Finance",
  PLATFORM_AUDITOR: "Platform Auditor",
};

function isPlatformRole(value: unknown): value is PlatformRole {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(
      ROLE_LABELS,
      value,
    )
  );
}

function isUserStatus(value: unknown): value is UserStatus {
  return value === "ACTIVE" || value === "INACTIVE";
}

function isPlatformUser(value: unknown): value is PlatformUser {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    typeof user.userId === "string" &&
    typeof user.staffId === "string" &&
    typeof user.name === "string" &&
    typeof user.email === "string" &&
    typeof user.phone === "string" &&
    isPlatformRole(user.role) &&
    isUserStatus(user.status) &&
    typeof user.lastLogin === "string" &&
    typeof user.createdAt === "string"
  );
}

function isProtectedSuperAdmin(
  user: PlatformUser,
): boolean {
  return (
    user.userId === PROTECTED_SUPER_ADMIN_ID ||
    user.staffId === PROTECTED_SUPER_ADMIN_STAFF_ID ||
    user.role === "SUPER_ADMIN"
  );
}

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

    const validUsers = parsed.filter(isPlatformUser);

    // Preserve the designated SuperAdmin record if the
    // browser's stored data has accidentally omitted it.
    const storedSuperAdmin = validUsers.find(
      (user) =>
        user.userId === PROTECTED_SUPER_ADMIN_ID ||
        user.staffId === PROTECTED_SUPER_ADMIN_STAFF_ID,
    );

    const otherUsers = validUsers.filter(
      (user) =>
        user.userId !== PROTECTED_SUPER_ADMIN_ID &&
        user.staffId !== PROTECTED_SUPER_ADMIN_STAFF_ID &&
        user.role !== "SUPER_ADMIN",
    );

    const protectedUser: PlatformUser = {
      ...DEMO_USERS[0],
      ...(storedSuperAdmin ?? {}),
      userId: PROTECTED_SUPER_ADMIN_ID,
      staffId: PROTECTED_SUPER_ADMIN_STAFF_ID,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    };

    const normalizedUsers = [
      protectedUser,
      ...otherUsers,
    ];

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalizedUsers),
    );

    return normalizedUsers;
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
  let number = users.length + 1;
  let userId = `PU-${String(number).padStart(4, "0")}`;

  while (users.some((user) => user.userId === userId)) {
    number += 1;
    userId = `PU-${String(number).padStart(4, "0")}`;
  }

  return userId;
}

function generateStaffId(users: PlatformUser[]) {
  let number = users.length + 1;
  let staffId = `UFA-PS-${String(number).padStart(3, "0")}`;

  while (users.some((user) => user.staffId === staffId)) {
    number += 1;
    staffId = `UFA-PS-${String(number).padStart(3, "0")}`;
  }

  return staffId;
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
    useState<ManagedPlatformRole>("PLATFORM_ADMIN");

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
    const targetUser = users.find(
      (user) => user.userId === userId,
    );

    if (!targetUser) {
      setMessage("User not found.");
      return;
    }

    if (isProtectedSuperAdmin(targetUser)) {
      setMessage(
        "The protected Super Admin account cannot be deactivated or reactivated here.",
      );
      return;
    }

    const nextUsers = users.map((user) => {
      if (user.userId !== userId) {
        return user;
      }

      return {
        ...user,
        status:
          user.status === "ACTIVE"
            ? "INACTIVE"
            : "ACTIVE",
      };
    });

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
    if (!isPlatformRole(role) || role === "SUPER_ADMIN") {
      setMessage(
        "Assigning the Super Admin role is not permitted here.",
      );
      return;
    }

    const targetUser = users.find(
      (user) => user.userId === userId,
    );

    if (!targetUser) {
      setMessage("User not found.");
      return;
    }

    if (isProtectedSuperAdmin(targetUser)) {
      setMessage(
        "The protected Super Admin role cannot be changed here.",
      );
      return;
    }

    const nextUsers = users.map((user) =>
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

    if (
      !Object.prototype.hasOwnProperty.call(
        MANAGED_ROLE_LABELS,
        newRole,
      )
    ) {
      setMessage(
        "The selected platform role is not permitted.",
      );
      return;
    }

    const emailExists = users.some(
      (user) =>
        user.email.toLowerCase() === email.toLowerCase(),
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

    const nextUsers = [...users, newUser];

    updateUsers(nextUsers);

    setShowCreateModal(false);
    setSelectedUser(newUser);
    resetForm();

    setMessage("Platform user created successfully.");
  }

  return (
    <section className="superadmin-users-page">
      <header className="superadmin-users-header">
        <div>
          <p className="page-eyebrow">
            PLATFORM ADMINISTRATION
          </p>

          <h1>Platform Users &amp; Roles</h1>

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
        <div
          className="users-message"
          role="status"
          aria-live="polite"
        >
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
          aria-label="Search platform users"
        />

        <select
          value={roleFilter}
          onChange={(event) =>
            setRoleFilter(
              event.target.value as "ALL" | PlatformRole,
            )
          }
          aria-label="Filter by platform role"
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
              event.target.value as "ALL" | UserStatus,
            )
          }
          aria-label="Filter by account status"
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
              {filteredUsers.length === 1 ? "" : "s"} found
            </span>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-users">
            <strong>No platform users found</strong>

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
                          {user.name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
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

                    <td>{formatDate(user.lastLogin)}</td>
                    <td>{formatDate(user.createdAt)}</td>

                    <td>
                      <button
                        className="view-button"
                        type="button"
                        onClick={() => {
                          setSelectedUser(user);
                          setMessage("");
                        }}
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
          <div
            className="users-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="platform-user-title"
          >
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">
                  PLATFORM USER
                </p>

                <h2 id="platform-user-title">
                  {selectedUser.name}
                </h2>
              </div>

              <button
                className="close-button"
                type="button"
                onClick={() => setSelectedUser(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="profile-summary">
              <div className="large-avatar">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>{selectedUser.name}</strong>
                <span>{selectedUser.email}</span>
                <span>{selectedUser.phone || "No phone"}</span>
              </div>
            </div>

            <div className="user-details-grid">
              <div>
                <span>User ID</span>
                <strong>{selectedUser.userId}</strong>
              </div>

              <div>
                <span>Staff ID</span>
                <strong>{selectedUser.staffId}</strong>
              </div>

              <div>
                <span>Created</span>
                <strong>{formatDate(selectedUser.createdAt)}</strong>
              </div>

              <div>
                <span>Last Login</span>
                <strong>{formatDate(selectedUser.lastLogin)}</strong>
              </div>
            </div>

            {isProtectedSuperAdmin(selectedUser) ? (
              <div className="modal-section">
                <span className="detail-label">
                  Protected Platform Role
                </span>

                <span className="role-badge">
                  Super Admin
                </span>

                <p>
                  This account is protected from role and
                  status changes in this interface.
                </p>
              </div>
            ) : (
              <>
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
                        event.target.value as PlatformRole,
                      )
                    }
                  >
                    {Object.entries(MANAGED_ROLE_LABELS).map(
                      ([role, label]) => (
                        <option key={role} value={role}>
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
              </>
            )}

            <div className="modal-actions">
              {!isProtectedSuperAdmin(selectedUser) && (
                <button
                  className={
                    selectedUser.status === "ACTIVE"
                      ? "danger-button"
                      : "primary-button"
                  }
                  type="button"
                  onClick={() =>
                    toggleStatus(selectedUser.userId)
                  }
                >
                  {selectedUser.status === "ACTIVE"
                    ? "Deactivate Account"
                    : "Reactivate Account"}
                </button>
              )}

              <button
                className="secondary-button"
                type="button"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-backdrop">
          <div
            className="users-modal create-user-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-platform-user-title"
          >
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">
                  PLATFORM ADMINISTRATION
                </p>

                <h2 id="create-platform-user-title">
                  Add Platform User
                </h2>
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
                  onChange={(event) => {
                    const value = event.target.value;

                    if (
                      Object.prototype.hasOwnProperty.call(
                        MANAGED_ROLE_LABELS,
                        value,
                      )
                    ) {
                      setNewRole(value as ManagedPlatformRole);
                    }
                  }}
                >
                  {Object.entries(MANAGED_ROLE_LABELS).map(
                    ([role, label]) => (
                      <option key={role} value={role}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            <div className="modal-note">
              New accounts are currently saved in this
              browser only. Secure authentication,
              server-side authorization, and password
              management still need to be connected before
              these records can be treated as secure
              platform accounts.
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

import { useEffect, useState } from "react";
import type { User } from "../../../domain/entities/user";
import {
USER_ROLES,
type UserRole,
} from "../../../domain/enums/roles";
import {
getUsers,
saveUser,
} from "../../../data/repositories/userRepository";
import {
createPasswordCredential,
savePasswordCredential,
} from "../../../data/repositories/passwordCredentialRepository";
import { isValidUser } from "../../../domain/validation/entityValidation";
import { getAuthSession } from "../auth/authSession";
import { recordAuditEvent } from "../audit/auditService";

export default function UsersPage() {
const [users, setUsers] = useState<User[]>([]);
const [name, setName] = useState("");
const [staffId, setStaffId] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] =
useState("");
const [role, setRole] = useState<UserRole>(
USER_ROLES.TEACHER,
);
const [error, setError] = useState("");

async function loadUsers() {
try {
const savedUsers = await getUsers();
setUsers(savedUsers);
setError("");
} catch {
setError("Unable to load users.");
}
}

useEffect(() => {
void loadUsers();
}, []);

async function handleAddUser() {
const userName = name.trim();
const userStaffId = staffId.trim();

// SuperAdmin accounts cannot be created through
// ordinary school user management.
if (role === USER_ROLES.SUPER_ADMIN) {
  setError(
    "Creating SuperAdmin accounts is not permitted here.",
  );
  return;
}

if (!userName) {
  setError("User name is required.");
  return;
}

if (!userStaffId) {
  setError("Staff ID is required.");
  return;
}

if (password.length < 8) {
  setError(
    "Password must be at least 8 characters.",
  );
  return;
}

if (password !== confirmPassword) {
  setError("Passwords do not match.");
  return;
}

try {
  const existingUsers = await getUsers();

  const duplicateStaffId = existingUsers.some(
    (user) =>
      user.staffId?.trim().toLowerCase() ===
      userStaffId.toLowerCase(),
  );

  if (duplicateStaffId) {
    setError("That Staff ID is already in use.");
    return;
  }

  const now = new Date().toISOString();

  const newUser: User = {
    userId: crypto.randomUUID(),
    schoolId: null,
    role,
    name: userName,
    staffId: userStaffId,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  if (!isValidUser(newUser)) {
    setError("Invalid user data.");
    return;
  }

  const passwordCredential =
    await createPasswordCredential(
      newUser.userId,
      password,
    );

  await saveUser(newUser);
  await savePasswordCredential(passwordCredential);

  const session = getAuthSession();

  if (session) {
    await recordAuditEvent(
      session.userId,
      "USER_CREATED",
      `Created user ${newUser.name} with Staff ID ${newUser.staffId}.`,
    );
  }

  await loadUsers();

  setName("");
  setStaffId("");
  setPassword("");
  setConfirmPassword("");
  setRole(USER_ROLES.TEACHER);
  setError("");
} catch {
  setError("Unable to create the user.");
}

}

return (
<section>
<h2>User Management</h2>

  <form
    onSubmit={(event) => {
      event.preventDefault();
      void handleAddUser();
    }}
  >
    <label>
      Name
      <input
        type="text"
        value={name}
        onChange={(event) =>
          setName(event.target.value)
        }
        placeholder="Enter name"
        required
      />
    </label>

    <label>
      Staff ID
      <input
        type="text"
        value={staffId}
        onChange={(event) =>
          setStaffId(event.target.value)
        }
        placeholder="Enter Staff ID"
        required
      />
    </label>

    <label>
      Password
      <input
        type="password"
        value={password}
        onChange={(event) =>
          setPassword(event.target.value)
        }
        placeholder="Minimum 8 characters"
        minLength={8}
        required
      />
    </label>

    <label>
      Confirm Password
      <input
        type="password"
        value={confirmPassword}
        onChange={(event) =>
          setConfirmPassword(event.target.value)
        }
        placeholder="Confirm password"
        minLength={8}
        required
      />
    </label>

    <label>
      Role
      <select
        value={role}
        onChange={(event) =>
          setRole(event.target.value as UserRole)
        }
      >
        {Object.values(USER_ROLES)
          .filter(
            (userRole) =>
              userRole !== USER_ROLES.SUPER_ADMIN,
          )
          .map((userRole) => (
            <option
              key={userRole}
              value={userRole}
            >
              {userRole}
            </option>
          ))}
      </select>
    </label>

    <button type="submit">
      Add User
    </button>
  </form>

  {error && <p role="alert">{error}</p>}

  <h3>Users</h3>

  {users.length === 0 ? (
    <p>No users have been added yet.</p>
  ) : (
    <ul>
      {users.map((user) => (
        <li key={user.userId}>
          {user.name} — {user.role} —{" "}
          {user.staffId ?? "No Staff ID"} —{" "}
          {user.status}
        </li>
      ))}
    </ul>
  )}
</section>

);
}

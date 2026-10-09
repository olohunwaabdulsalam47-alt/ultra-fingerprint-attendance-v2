import { useEffect, useState } from "react";

import type { User } from "../../../domain/entities/user";

import {
  USER_ROLES,
  type UserRole,
} from "../../../domain/enums/roles";

import {
  getUsersBySchool,
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadUsers() {
    setLoading(true);

    try {
      const session = getAuthSession();

      if (
        !session ||
        session.role !== USER_ROLES.PRINCIPAL ||
        !session.schoolId
      ) {
        setUsers([]);
        setError(
          "Only an authenticated school Principal can manage school users.",
        );
        return;
      }

      const schoolUsers = await getUsersBySchool(
        session.schoolId,
      );

      setUsers(schoolUsers);
      setError("");
    } catch {
      setUsers([]);
      setError("Unable to load school users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function handleAddUser() {
    if (saving) {
      return;
    }

    const session = getAuthSession();

    if (
      !session ||
      session.role !== USER_ROLES.PRINCIPAL ||
      !session.schoolId
    ) {
      setError(
        "You are not authorized to create school users.",
      );
      return;
    }

    const userName = name.trim();
    const userStaffId = staffId.trim();

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

    setSaving(true);
    setError("");

    try {
      const schoolUsers = await getUsersBySchool(
        session.schoolId,
      );

      const duplicateStaffId = schoolUsers.some(
        (user) =>
          user.staffId?.trim().toLowerCase() ===
          userStaffId.toLowerCase(),
      );

      if (duplicateStaffId) {
        setError(
          "That Staff ID is already in use at this school.",
        );
        return;
      }

      const now = new Date().toISOString();

      const newUser: User = {
        userId: crypto.randomUUID(),
        schoolId: session.schoolId,
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

      await savePasswordCredential(
        passwordCredential,
      );

      await recordAuditEvent(
        session.userId,
        "USER_CREATED",
        `Created ${newUser.role} ${newUser.name} at the current school.`,
      );

      await loadUsers();

      setName("");
      setStaffId("");
      setPassword("");
      setConfirmPassword("");
      setRole(USER_ROLES.TEACHER);
    } catch {
      setError("Unable to create the user.");
    } finally {
      setSaving(false);
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
              setRole(
                event.target.value as UserRole,
              )
            }
          >
            {Object.values(USER_ROLES)
              .filter(
                (userRole) =>
                  userRole !==
                  USER_ROLES.SUPER_ADMIN,
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

        <button
          type="submit"
          disabled={saving || loading}
        >
          {saving ? "Creating User..." : "Add User"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      <h3>School Users</h3>

      {loading ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <p>No users have been added to this school yet.</p>
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

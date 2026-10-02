import { describe, expect, it } from "vitest";
import {
  getRolePermissions,
  hasPermission,
} from "./permissions";

describe("role permissions", () => {
  it("gives SuperAdmin all permissions", () => {
    expect(
      hasPermission("SuperAdmin", "MANAGE_USERS"),
    ).toBe(true);

    expect(
      hasPermission("SuperAdmin", "VIEW_AUDIT_LOGS"),
    ).toBe(true);
  });

  it("gives Principal management permissions", () => {
    expect(
      hasPermission("Principal", "MANAGE_STUDENTS"),
    ).toBe(true);

    expect(
      hasPermission("Principal", "RECORD_ATTENDANCE"),
    ).toBe(true);
  });

  it("does not give Teacher user-management permission", () => {
    expect(
      hasPermission("Teacher", "MANAGE_USERS"),
    ).toBe(false);
  });

  it("returns permissions for a role", () => {
    const permissions = getRolePermissions("Teacher");

    expect(permissions).toContain("RECORD_ATTENDANCE");
    expect(permissions).not.toContain("MANAGE_USERS");
  });
});

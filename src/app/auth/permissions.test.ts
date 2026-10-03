import { describe, expect, it } from "vitest";
import {
  getRolePermissions,
  hasPermission,
} from "./permissions";

describe("role permissions", () => {
  it("restricts SuperAdmin to platform management permissions", () => {
    expect(
      hasPermission("SuperAdmin", "MANAGE_SCHOOLS"),
    ).toBe(true);

    expect(
      hasPermission("SuperAdmin", "VIEW_REPORTS"),
    ).toBe(true);

    expect(
      hasPermission("SuperAdmin", "VIEW_AUDIT_LOGS"),
    ).toBe(true);

    expect(
      hasPermission("SuperAdmin", "MANAGE_USERS"),
    ).toBe(false);

    expect(
      hasPermission("SuperAdmin", "MANAGE_STUDENTS"),
    ).toBe(false);

    expect(
      hasPermission("SuperAdmin", "RECORD_ATTENDANCE"),
    ).toBe(false);

    expect(
      hasPermission("SuperAdmin", "REGISTER_BIOMETRIC"),
    ).toBe(false);
  });

  it("gives Principal management permissions", () => {
    expect(
      hasPermission("Principal", "MANAGE_USERS"),
    ).toBe(true);

    expect(
      hasPermission("Principal", "MANAGE_SCHOOLS"),
    ).toBe(true);

    expect(
      hasPermission("Principal", "MANAGE_CLASSES"),
    ).toBe(true);

    expect(
      hasPermission("Principal", "MANAGE_STUDENTS"),
    ).toBe(true);

    expect(
      hasPermission("Principal", "RECORD_ATTENDANCE"),
    ).toBe(true);

    expect(
      hasPermission("Principal", "REGISTER_BIOMETRIC"),
    ).toBe(true);
  });

  it("does not give Teacher user-management permission", () => {
    expect(
      hasPermission("Teacher", "MANAGE_USERS"),
    ).toBe(false);
  });

  it("returns permissions for a role", () => {
    expect(
      getRolePermissions("Teacher").length,
    ).toBeGreaterThan(0);
  });
});

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getRolePermissions,
  hasPermission,
} from "./permissions";

describe("role permissions", () => {
  it("restricts SuperAdmin to platform management permissions", () => {
    expect(
      hasPermission(
        "SuperAdmin",
        "MANAGE_PLATFORM",
      ),
    ).toBe(true);

    expect(
      hasPermission(
        "SuperAdmin",
        "MANAGE_STUDENTS",
      ),
    ).toBe(false);

    expect(
      hasPermission(
        "SuperAdmin",
        "RECORD_ATTENDANCE",
      ),
    ).toBe(false);

    expect(
      hasPermission(
        "SuperAdmin",
        "MANAGE_BIOMETRIC",
      ),
    ).toBe(false);
  });

  it("gives Principal management permissions", () => {
    expect(
      hasPermission(
        "Principal",
        "MANAGE_SCHOOLS",
      ),
    ).toBe(true);

    expect(
      hasPermission(
        "Principal",
        "MANAGE_STUDENTS",
      ),
    ).toBe(true);

    expect(
      hasPermission(
        "Principal",
        "RECORD_ATTENDANCE",
      ),
    ).toBe(true);
  });

  it("does not give Teacher user-management permission", () => {
    expect(
      hasPermission(
        "Teacher",
        "MANAGE_USERS",
      ),
    ).toBe(false);

    expect(
      hasPermission(
        "Teacher",
        "RECORD_ATTENDANCE",
      ),
    ).toBe(true);
  });

  it("returns permissions for a role", () => {
    const permissions =
      getRolePermissions("Teacher");

    expect(
      Array.isArray(permissions),
    ).toBe(true);

    expect(
      permissions.length,
    ).toBeGreaterThan(0);
  });
});

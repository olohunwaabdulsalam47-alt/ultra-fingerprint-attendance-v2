import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAuthSession,
  getAuthSession,
  isAuthenticated,
  saveAuthSession,
} from "./authSession";
import type { AuthSession } from "../../../domain/entities/authSession";

const session: AuthSession = {
  userId: "user-1",
  staffId: "STAFF001",
  name: "Test User",
  role: "Teacher",
  loginMethod: "PASSWORD",
  createdAt: "2026-10-02T00:00:00.000Z",
};

describe("auth session", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("saves and retrieves an authentication session", () => {
    saveAuthSession(session);

    expect(getAuthSession()).toEqual(session);
    expect(isAuthenticated()).toBe(true);
  });

  it("clears the authentication session", () => {
    saveAuthSession(session);

    clearAuthSession();

    expect(getAuthSession()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it("returns null for an invalid stored session", () => {
    sessionStorage.setItem(
      "ultra-fingerprint-auth-session",
      "{invalid-json",
    );

    expect(getAuthSession()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });
});

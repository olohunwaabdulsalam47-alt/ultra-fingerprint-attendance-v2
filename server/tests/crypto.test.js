import assert from "node:assert/strict";
import { test } from "node:test";

import {
  generateOtp,
  generateSecureToken,
  hashOtp,
  hashPassword,
  hashToken,
  safeCompareHex,
  verifyPassword,
} from "../dist/auth/crypto.js";

test("password hashing produces a hash without exposing the password", async () => {
  const password = "Example-Password-123!";
  const passwordHash = await hashPassword(password);

  assert.notEqual(passwordHash, password);
  assert.match(passwordHash, /^scrypt\$16384\$8\$1\$/);

  assert.equal(await verifyPassword(password, passwordHash), true);
});

test("different password salts produce different hashes", async () => {
  const password = "Example-Password-123!";

  const firstHash = await hashPassword(password);
  const secondHash = await hashPassword(password);

  assert.notEqual(firstHash, secondHash);

  assert.equal(await verifyPassword(password, firstHash), true);
  assert.equal(await verifyPassword(password, secondHash), true);
});

test("incorrect passwords are rejected", async () => {
  const passwordHash = await hashPassword("Correct-Password-123!");

  assert.equal(
    await verifyPassword("Incorrect-Password-123!", passwordHash),
    false,
  );
});

test("malformed password hashes are rejected", async () => {
  assert.equal(await verifyPassword("some-password", "invalid"), false);
  assert.equal(await verifyPassword("", "invalid"), false);
});

test("secure tokens are generated and hashed", () => {
  const firstToken = generateSecureToken();
  const secondToken = generateSecureToken();

  assert.notEqual(firstToken, secondToken);
  assert.equal(firstToken.length >= 32, true);

  const firstHash = hashToken(firstToken);

  assert.notEqual(firstHash, firstToken);
  assert.match(firstHash, /^[0-9a-f]{64}$/);

  assert.notEqual(firstHash, hashToken(secondToken));
});

test("OTP generation produces six numeric digits", () => {
  for (let i = 0; i < 100; i += 1) {
    assert.match(generateOtp(), /^[0-9]{6}$/);
  }
});

test("OTP hashes depend on the challenge ID and OTP", () => {
  process.env.SESSION_SECRET =
    "test-only-secret-with-at-least-32-bytes";

  const challengeId = "12345678-1234-4234-8234-123456789abc";
  const otp = "012345";

  const firstHash = hashOtp(challengeId, otp);

  assert.match(firstHash, /^[0-9a-f]{64}$/);
  assert.equal(hashOtp(challengeId, otp), firstHash);

  assert.notEqual(
    hashOtp("87654321-4321-4321-8321-cba987654321", otp),
    firstHash,
  );

  assert.notEqual(
    hashOtp(challengeId, "543210"),
    firstHash,
  );
});

test("OTP hashing rejects malformed inputs", () => {
  process.env.SESSION_SECRET =
    "test-only-secret-with-at-least-32-bytes";

  assert.throws(() => hashOtp("invalid-id", "123456"));
  assert.throws(() =>
    hashOtp("12345678-1234-4234-8234-123456789abc", "12"),
  );
});

test("hexadecimal hash comparison works safely", () => {
  assert.equal(safeCompareHex("aabbcc", "aabbcc"), true);
  assert.equal(safeCompareHex("aabbcc", "aabbcd"), false);
  assert.equal(safeCompareHex("aabb", "aabbcc"), false);
  assert.equal(safeCompareHex("xyz", "xyz"), false);
  assert.equal(safeCompareHex("abc", "abc"), false);
});

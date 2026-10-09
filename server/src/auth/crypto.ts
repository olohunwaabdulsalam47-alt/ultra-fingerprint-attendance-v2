import {
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 64 * 1024 * 1024;

function scryptAsync(
  password: string,
  salt: Buffer,
  keyLength: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      keyLength,
      {
        N: SCRYPT_N,
        r: SCRYPT_R,
        p: SCRYPT_P,
        maxmem: MAX_MEMORY,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey as Buffer);
      },
    );
  });
}

/**
 * Hashes a password using scrypt and a unique random salt.
 * Store the returned string, never the original password.
 */
export async function hashPassword(
  password: string,
): Promise<string> {
  if (password.length < 1 || password.length > 1024) {
    throw new Error("Password length is invalid.");
  }

  const salt = randomBytes(16);
  const derivedKey = await scryptAsync(
    password,
    salt,
    KEY_LENGTH,
  );

  return [
    "scrypt",
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString("hex"),
    derivedKey.toString("hex"),
  ].join("$");
}

/**
 * Verifies a password against a stored scrypt hash.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  if (
    password.length < 1 ||
    password.length > 1024 ||
    storedHash.length > 512
  ) {
    return false;
  }

  const parts = storedHash.split("$");

  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }

  const [, nText, rText, pText, saltHex, hashHex] = parts;

  if (
    nText !== String(SCRYPT_N) ||
    rText !== String(SCRYPT_R) ||
    pText !== String(SCRYPT_P) ||
    !/^[0-9a-f]{32}$/i.test(saltHex) ||
    !/^[0-9a-f]{128}$/i.test(hashHex)
  ) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expectedHash = Buffer.from(hashHex, "hex");

  const actualHash = await scryptAsync(
    password,
    salt,
    KEY_LENGTH,
  );

  return timingSafeEqual(actualHash, expectedHash);
}

/**
 * Generates a cryptographically random token.
 * Suitable for session tokens and trusted-device tokens.
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Hashes a high-entropy token before database storage.
 */
export function hashToken(token: string): string {
  if (token.length < 32 || token.length > 512) {
    throw new Error("Token length is invalid.");
  }

  return createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}

/**
 * Generates a numeric one-time password.
 * The caller must store only its protected hash and enforce
 * expiry, attempt limits, and single-use verification.
 */
export function generateOtp(): string {
  const value = randomBytes(4).readUInt32BE(0) % 1_000_000;

  return value.toString().padStart(6, "0");
}

/**
 * Protects short OTP codes using a server-side secret.
 * Include the challenge ID so hashes cannot be reused
 * across different OTP challenges.
 */
export function hashOtp(
  challengeId: string,
  otp: string,
): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error(
      "SESSION_SECRET must contain at least 32 bytes.",
    );
  }

  if (
    !/^[0-9a-f-]{36}$/i.test(challengeId) ||
    !/^[0-9]{6}$/.test(otp)
  ) {
    throw new Error("OTP challenge or code is invalid.");
  }

  return createHmac("sha256", secret)
    .update(`${challengeId}:${otp}`, "utf8")
    .digest("hex");
}

/**
 * Compares two hexadecimal hashes without ordinary
 * string comparison of their contents.
 */
export function safeCompareHex(
  first: string,
  second: string,
): boolean {
  if (
    !/^[0-9a-f]+$/i.test(first) ||
    !/^[0-9a-f]+$/i.test(second) ||
    first.length !== second.length ||
    first.length % 2 !== 0
  ) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(first, "hex"),
    Buffer.from(second, "hex"),
  );
}

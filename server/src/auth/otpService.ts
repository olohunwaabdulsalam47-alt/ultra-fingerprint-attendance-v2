import { randomUUID } from "node:crypto";

import { databasePool } from "../config/database.js";
import {
  generateOtp,
  hashOtp,
  safeCompareHex,
} from "./crypto.js";

const OTP_LIFETIME_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export const OTP_PURPOSES = [
  "TRUST_NEW_DEVICE",
  "SUPERADMIN_LOGIN",
  "SECURITY_PAGE_ACCESS",
  "PASSWORD_RESET",
  "INITIAL_SETUP",
] as const;

export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export interface CreatedOtpChallenge {
  challengeId: string;
  otpCode: string;
  expiresAt: Date;
  purpose: OtpPurpose;
}

export type OtpVerificationResult =
  | "VERIFIED"
  | "INVALID"
  | "EXPIRED"
  | "LOCKED"
  | "ALREADY_USED";

interface OtpChallengeRow {
  id: string;
  platform_user_id: string;
  phone_number: string;
  otp_hash: string;
  purpose: OtpPurpose;
  expires_at: Date | string;
  attempts: number;
  consumed_at: Date | string | null;
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isOtpPurpose(value: string): value is OtpPurpose {
  return OTP_PURPOSES.some((purpose) => purpose === value);
}

/**
 * Creates a purpose-specific OTP challenge for an active SuperAdmin.
 *
 * Call this only after verifying the password or other prerequisite
 * required by the requested operation.
 *
 * Send otpCode through the SMS provider on the server.
 * Never return the OTP itself to the browser or log it.
 *
 * Migration 002 must be applied before using this service.
 */
export async function createOtpChallenge(
  platformUserId: string,
  phoneNumber: string,
  purpose: OtpPurpose = "TRUST_NEW_DEVICE",
): Promise<CreatedOtpChallenge> {
  if (
    !isValidUuid(platformUserId) ||
    !/^\+[1-9][0-9]{7,14}$/.test(phoneNumber) ||
    !isOtpPurpose(purpose)
  ) {
    throw new Error("OTP challenge details are invalid.");
  }

  const challengeId = randomUUID();
  const otpCode = generateOtp();
  const otpHash = hashOtp(challengeId, otpCode);
  const expiresAt = new Date(Date.now() + OTP_LIFETIME_MS);

  const client = await databasePool.connect();

  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;

    const account = await client.query(
      `
        SELECT id
        FROM platform_users
        WHERE id = $1
          AND phone_number = $2
          AND role = 'SUPER_ADMIN'
          AND is_active = TRUE
        FOR UPDATE
      `,
      [platformUserId, phoneNumber],
    );

    if (account.rowCount !== 1) {
      throw new Error("Unable to create OTP challenge.");
    }

    // Invalidate older, unused challenges for this account and purpose.
    await client.query(
      `
        UPDATE platform_otp_challenges
        SET consumed_at = NOW()
        WHERE platform_user_id = $1
          AND purpose = $2
          AND consumed_at IS NULL
      `,
      [platformUserId, purpose],
    );

    await client.query(
      `
        INSERT INTO platform_otp_challenges (
          id,
          platform_user_id,
          phone_number,
          otp_hash,
          purpose,
          expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        challengeId,
        platformUserId,
        phoneNumber,
        otpHash,
        purpose,
        expiresAt,
      ],
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return {
      challengeId,
      otpCode,
      expiresAt,
      purpose,
    };
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve the original database error.
      }
    }

    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verifies a specific OTP challenge.
 *
 * The expected purpose must be supplied by the server-side route.
 * The client cannot choose the purpose or account being authenticated.
 *
 * Row locking prevents concurrent requests from consuming the same
 * challenge successfully more than once.
 */
export async function verifyOtpChallenge(
  challengeId: string,
  submittedOtp: string,
  expectedPurpose: OtpPurpose = "TRUST_NEW_DEVICE",
): Promise<OtpVerificationResult> {
  if (
    !isValidUuid(challengeId) ||
    !/^[0-9]{6}$/.test(submittedOtp) ||
    !isOtpPurpose(expectedPurpose)
  ) {
    return "INVALID";
  }

  const client = await databasePool.connect();

  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;

    const result = await client.query<OtpChallengeRow>(
      `
        SELECT
          id,
          platform_user_id,
          phone_number,
          otp_hash,
          purpose,
          expires_at,
          attempts,
          consumed_at
        FROM platform_otp_challenges
        WHERE id = $1
          AND purpose = $2
        FOR UPDATE
      `,
      [challengeId, expectedPurpose],
    );

    const challenge = result.rows[0];

    if (!challenge) {
      await client.query("COMMIT");
      transactionStarted = false;
      return "INVALID";
    }

    if (challenge.consumed_at !== null) {
      await client.query("COMMIT");
      transactionStarted = false;
      return "ALREADY_USED";
    }

    if (new Date(challenge.expires_at).getTime() <= Date.now()) {
      await client.query(
        `
          UPDATE platform_otp_challenges
          SET consumed_at = NOW()
          WHERE id = $1
        `,
        [challengeId],
      );

      await client.query("COMMIT");
      transactionStarted = false;
      return "EXPIRED";
    }

    if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
      await client.query(
        `
          UPDATE platform_otp_challenges
          SET consumed_at = NOW()
          WHERE id = $1
        `,
        [challengeId],
      );

      await client.query("COMMIT");
      transactionStarted = false;
      return "LOCKED";
    }

    const submittedHash = hashOtp(challengeId, submittedOtp);

    const matches = safeCompareHex(
      challenge.otp_hash,
      submittedHash,
    );

    if (!matches) {
      const newAttempts = challenge.attempts + 1;
      const locked = newAttempts >= MAX_OTP_ATTEMPTS;

      await client.query(
        `
          UPDATE platform_otp_challenges
          SET
            attempts = $2,
            consumed_at = CASE
              WHEN $3 THEN NOW()
              ELSE consumed_at
            END
          WHERE id = $1
        `,
        [challengeId, newAttempts, locked],
      );

      await client.query("COMMIT");
      transactionStarted = false;

      return locked ? "LOCKED" : "INVALID";
    }

    // Recheck the account and phone number before accepting the OTP.
    const account = await client.query(
      `
        SELECT users.id
        FROM platform_users AS users
        INNER JOIN platform_otp_challenges AS challenges
          ON challenges.platform_user_id = users.id
        WHERE challenges.id = $1
          AND challenges.purpose = $2
          AND users.role = 'SUPER_ADMIN'
          AND users.is_active = TRUE
          AND users.phone_number = challenges.phone_number
        FOR UPDATE OF users
      `,
      [challengeId, expectedPurpose],
    );

    if (account.rowCount !== 1) {
      await client.query(
        `
          UPDATE platform_otp_challenges
          SET consumed_at = NOW()
          WHERE id = $1
        `,
        [challengeId],
      );

      await client.query("COMMIT");
      transactionStarted = false;
      return "INVALID";
    }

    await client.query(
      `
        UPDATE platform_otp_challenges
        SET consumed_at = NOW()
        WHERE id = $1
      `,
      [challengeId],
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return "VERIFIED";
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve the original database error.
      }
    }

    throw error;
  } finally {
    client.release();
  }
      }

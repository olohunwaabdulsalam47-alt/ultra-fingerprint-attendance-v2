import { randomUUID } from "node:crypto";
import { databasePool } from "../config/database.js";
import {
  generateOtp,
  hashOtp,
  safeCompareHex,
} from "./crypto.js";

const OTP_LIFETIME_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export interface CreatedOtpChallenge {
  challengeId: string;
  otpCode: string;
  expiresAt: Date;
}

export type OtpVerificationResult =
  | "VERIFIED"
  | "INVALID"
  | "EXPIRED"
  | "LOCKED"
  | "ALREADY_USED";

interface OtpChallengeRow {
  id: string;
  otp_hash: string;
  expires_at: Date | string;
  attempts: number;
  consumed_at: Date | string | null;
}

/**
 * Creates an OTP challenge for an authenticated platform user.
 *
 * IMPORTANT:
 * - Call this only after verifying the user's password.
 * - Send otpCode to the user's verified phone using the SMS
 *   provider on the server.
 * - Never return otpCode to the browser or log it.
 * - Database migrations 002 and 003 must be applied first.
 */
export async function createOtpChallenge(
  platformUserId: string,
  phoneNumber: string,
): Promise<CreatedOtpChallenge> {
  if (
    !/^[0-9a-f-]{36}$/i.test(platformUserId) ||
    !/^\+[1-9][0-9]{7,14}$/.test(phoneNumber)
  ) {
    throw new Error("OTP challenge details are invalid.");
  }

  const challengeId = randomUUID();
  const otpCode = generateOtp();
  const otpHash = hashOtp(challengeId, otpCode);
  const expiresAt = new Date(Date.now() + OTP_LIFETIME_MS);

  const client = await databasePool.connect();

  try {
    await client.query("BEGIN");

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

    // Invalidate any older, unused OTP challenges for this user.
    await client.query(
      `
        UPDATE platform_otp_challenges
        SET consumed_at = NOW()
        WHERE platform_user_id = $1
          AND purpose = 'TRUST_NEW_DEVICE'
          AND consumed_at IS NULL
      `,
      [platformUserId],
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
        VALUES ($1, $2, $3, $4, 'TRUST_NEW_DEVICE', $5)
      `,
      [
        challengeId,
        platformUserId,
        phoneNumber,
        otpHash,
        expiresAt,
      ],
    );

    await client.query("COMMIT");

    return {
      challengeId,
      otpCode,
      expiresAt,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verifies an OTP challenge.
 *
 * Challenge row locking ensures simultaneous verification
 * requests cannot successfully consume the same OTP twice.
 *
 * The caller must not trust a client-provided user ID.
 * The challenge itself determines which account is checked.
 */
export async function verifyOtpChallenge(
  challengeId: string,
  submittedOtp: string,
): Promise<OtpVerificationResult> {
  if (
    !/^[0-9a-f-]{36}$/i.test(challengeId) ||
    !/^[0-9]{6}$/.test(submittedOtp)
  ) {
    return "INVALID";
  }

  const client = await databasePool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<OtpChallengeRow>(
      `
        SELECT
          id,
          otp_hash,
          expires_at,
          attempts,
          consumed_at
        FROM platform_otp_challenges
        WHERE id = $1
          AND purpose = 'TRUST_NEW_DEVICE'
        FOR UPDATE
      `,
      [challengeId],
    );

    const challenge = result.rows[0];

    if (!challenge) {
      await client.query("COMMIT");
      return "INVALID";
    }

    if (challenge.consumed_at !== null) {
      await client.query("COMMIT");
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

      return locked ? "LOCKED" : "INVALID";
    }

    // Recheck that the account is still active before accepting OTP.
    const account = await client.query(
      `
        SELECT users.id
        FROM platform_users AS users
        INNER JOIN platform_otp_challenges AS challenges
          ON challenges.platform_user_id = users.id
        WHERE challenges.id = $1
          AND users.role = 'SUPER_ADMIN'
          AND users.is_active = TRUE
          AND users.phone_number = challenges.phone_number
        FOR UPDATE OF users
      `,
      [challengeId],
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
    return "VERIFIED";
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

import { databasePool } from "../config/database.js";
import {
  generateSecureToken,
  hashToken,
} from "./crypto.js";

const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;

export interface CreatedPlatformSession {
  sessionToken: string;
  expiresAt: Date;
}

interface SessionDatabaseRow {
  id: string;
  platform_user_id: string;
  expires_at: Date | string;
}

/**
 * Creates a server-side session for a platform user.
 *
 * Call this only after the complete authentication flow,
 * including any required new-device OTP verification.
 *
 * The raw session token is returned once to the caller.
 * Only its SHA-256 hash is stored in PostgreSQL.
 */
export async function createPlatformSession(
  platformUserId: string,
  trustedDeviceId: string | null = null,
): Promise<CreatedPlatformSession> {
  if (
    typeof platformUserId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(platformUserId)
  ) {
    throw new Error("Platform user ID is invalid.");
  }

  if (
    trustedDeviceId !== null &&
    (
      typeof trustedDeviceId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(trustedDeviceId)
    )
  ) {
    throw new Error("Trusted device ID is invalid.");
  }

  const sessionToken = generateSecureToken();
  const sessionTokenHash = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);

  const result = await databasePool.query<{ id: string }>(
    `
      INSERT INTO platform_sessions (
        platform_user_id,
        trusted_device_id,
        session_token_hash,
        expires_at
      )
      SELECT
        users.id,
        devices.id,
        $3,
        $4
      FROM platform_users AS users
      LEFT JOIN platform_trusted_devices AS devices
        ON devices.id = $2
       AND devices.platform_user_id = users.id
       AND devices.revoked_at IS NULL
       AND devices.expires_at > NOW()
      WHERE users.id = $1
        AND users.role = 'SUPER_ADMIN'
        AND users.is_active = TRUE
        AND (
          $2::uuid IS NULL
          OR devices.id IS NOT NULL
        )
      RETURNING id
    `,
    [
      platformUserId,
      trustedDeviceId,
      sessionTokenHash,
      expiresAt,
    ],
  );

  if (result.rowCount !== 1) {
    throw new Error(
      "Unable to create a session for this SuperAdmin account.",
    );
  }

  return {
    sessionToken,
    expiresAt,
  };
}

/**
 * Checks whether a session token belongs to an active
 * SuperAdmin account and has not expired or been revoked.
 *
 * Returns null for invalid or inactive sessions.
 */
export async function validateSuperAdminSession(
  sessionToken: string,
): Promise<{ id: string } | null> {
  if (
    typeof sessionToken !== "string" ||
    sessionToken.length < 32 ||
    sessionToken.length > 512
  ) {
    return null;
  }

  const sessionTokenHash = hashToken(sessionToken);

  const result = await databasePool.query<SessionDatabaseRow>(
    `
      SELECT
        sessions.id,
        sessions.platform_user_id,
        sessions.expires_at
      FROM platform_sessions AS sessions
      INNER JOIN platform_users AS users
        ON users.id = sessions.platform_user_id
      WHERE sessions.session_token_hash = $1
        AND sessions.revoked_at IS NULL
        AND sessions.expires_at > NOW()
        AND users.role = 'SUPER_ADMIN'
        AND users.is_active = TRUE
      LIMIT 1
    `,
    [sessionTokenHash],
  );

  const session = result.rows[0];

  if (!session) {
    return null;
  }

  await databasePool.query(
    `
      UPDATE platform_sessions
      SET last_used_at = NOW()
      WHERE id = $1
    `,
    [session.id],
  );

  return {
    id: session.platform_user_id,
  };
}

/**
 * Revokes a session without storing or exposing its
 * raw token in the database.
 */
export async function revokeSuperAdminSession(
  sessionToken: string,
): Promise<void> {
  if (
    typeof sessionToken !== "string" ||
    sessionToken.length < 32 ||
    sessionToken.length > 512
  ) {
    return;
  }

  const sessionTokenHash = hashToken(sessionToken);

  await databasePool.query(
    `
      UPDATE platform_sessions
      SET revoked_at = NOW()
      WHERE session_token_hash = $1
        AND revoked_at IS NULL
    `,
    [sessionTokenHash],
  );
}

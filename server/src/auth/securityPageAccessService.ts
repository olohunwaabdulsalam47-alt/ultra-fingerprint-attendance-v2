import { databasePool } from "../config/database.js";
import { generateSecureToken, hashToken } from "./crypto.js";

const SECURITY_GRANT_LIFETIME_MS = 5 * 60 * 1000;

export interface SecurityAccessGrant {
  grantToken: string;
  expiresAt: Date;
}

/**
 * Issues a short-lived security-page grant.
 *
 * Call this function only after the backend has verified the
 * SECURITY_PAGE_ACCESS OTP for the authenticated SuperAdmin.
 *
 * The raw grant token is returned once to the caller.
 * Only its hash is stored in PostgreSQL.
 */
export async function createSecurityAccessGrant(
  platformUserId: string,
  sessionToken: string,
): Promise<SecurityAccessGrant> {
  const client = await databasePool.connect();

  try {
    await client.query("BEGIN");

    const sessionTokenHash = hashToken(sessionToken);

    const sessionResult = await client.query<{
      platform_user_id: string;
    }>(
      `
        SELECT s.platform_user_id
        FROM platform_sessions AS s
        JOIN platform_users AS u
          ON u.id = s.platform_user_id
        WHERE s.session_token_hash = $1
          AND s.platform_user_id = $2
          AND s.revoked_at IS NULL
          AND s.expires_at > NOW()
          AND u.role = 'SUPER_ADMIN'
          AND u.is_active = TRUE
        FOR UPDATE OF s
      `,
      [sessionTokenHash, platformUserId],
    );

    if (sessionResult.rowCount !== 1) {
      throw new Error("A valid SuperAdmin session is required.");
    }

    const grantToken = generateSecureToken();
    const grantTokenHash = hashToken(grantToken);

    const expiresAt = new Date(
      Date.now() + SECURITY_GRANT_LIFETIME_MS,
    );

    await client.query(
      `
        UPDATE platform_security_access_grants
        SET revoked_at = NOW()
        WHERE platform_user_id = $1
          AND session_token_hash = $2
          AND revoked_at IS NULL
      `,
      [platformUserId, sessionTokenHash],
    );

    await client.query(
      `
        INSERT INTO platform_security_access_grants (
          platform_user_id,
          session_token_hash,
          grant_token_hash,
          expires_at
        )
        VALUES ($1, $2, $3, $4)
      `,
      [
        platformUserId,
        sessionTokenHash,
        grantTokenHash,
        expiresAt,
      ],
    );

    await client.query("COMMIT");

    return {
      grantToken,
      expiresAt,
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original error.
    }

    throw error;
  } finally {
    client.release();
  }
}

/**
 * Validates a security-page grant against the database.
 *
 * Access is denied if the grant has expired or been revoked,
 * the login session has expired or been revoked, or the
 * associated account is no longer an active SuperAdmin.
 */
export async function validateSecurityAccessGrant(
  grantToken: string,
): Promise<string | null> {
  if (
    typeof grantToken !== "string" ||
    grantToken.length < 32 ||
    grantToken.length > 512
  ) {
    return null;
  }

  const grantTokenHash = hashToken(grantToken);

  const result = await databasePool.query<{
    platform_user_id: string;
  }>(
    `
      SELECT g.platform_user_id
      FROM platform_security_access_grants AS g
      JOIN platform_sessions AS s
        ON s.session_token_hash = g.session_token_hash
      JOIN platform_users AS u
        ON u.id = g.platform_user_id
      WHERE g.grant_token_hash = $1
        AND g.revoked_at IS NULL
        AND g.expires_at > NOW()
        AND s.platform_user_id = g.platform_user_id
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
        AND u.role = 'SUPER_ADMIN'
        AND u.is_active = TRUE
    `,
    [grantTokenHash],
  );

  return result.rows[0]?.platform_user_id ?? null;
}

/**
 * Revokes every security-page grant associated with a login
 * session. Call this during logout or session revocation.
 */
export async function revokeSecurityAccessGrants(
  sessionToken: string,
): Promise<void> {
  const sessionTokenHash = hashToken(sessionToken);

  await databasePool.query(
    `
      UPDATE platform_security_access_grants
      SET revoked_at = NOW()
      WHERE session_token_hash = $1
        AND revoked_at IS NULL
    `,
    [sessionTokenHash],
  );
}

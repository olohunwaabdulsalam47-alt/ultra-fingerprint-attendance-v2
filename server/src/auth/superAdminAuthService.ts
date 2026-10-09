import { databasePool } from "../config/database.js";
import { verifyPassword } from "./crypto.js";

export interface SuperAdminAccount {
  id: string;
  fullName: string;
  phoneNumber: string;
}

interface SuperAdminDatabaseRow {
  id: string;
  full_name: string;
  phone_number: string;
  password_hash: string;
}

/**
 * Authenticates an active SuperAdmin using a phone number
 * and password.
 *
 * This function does not create accounts, send OTPs,
 * create sessions, or grant access to other platform roles.
 */
export async function authenticateSuperAdmin(
  phoneNumber: string,
  password: string,
): Promise<SuperAdminAccount | null> {
  if (
    typeof phoneNumber !== "string" ||
    typeof password !== "string" ||
    !/^\+[1-9][0-9]{7,14}$/.test(phoneNumber) ||
    password.length < 1 ||
    password.length > 1024
  ) {
    return null;
  }

  const result = await databasePool.query<SuperAdminDatabaseRow>(
    `
      SELECT
        id,
        full_name,
        phone_number,
        password_hash
      FROM platform_users
      WHERE phone_number = $1
        AND role = 'SUPER_ADMIN'
        AND is_active = TRUE
      LIMIT 1
    `,
    [phoneNumber],
  );

  const account = result.rows[0];

  if (!account) {
    return null;
  }

  const passwordMatches = await verifyPassword(
    password,
    account.password_hash,
  );

  if (!passwordMatches) {
    return null;
  }

  return {
    id: account.id,
    fullName: account.full_name,
    phoneNumber: account.phone_number,
  };
}

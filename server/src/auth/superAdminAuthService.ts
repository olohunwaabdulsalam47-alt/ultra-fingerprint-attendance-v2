
import { databasePool } from "../config/database.js";
import { verifyPassword } from "./crypto.js";

export interface SuperAdminAccount {
  id: string;
  fullName: string;
  phoneNumber: string;
  staffId: string | null;
}

interface SuperAdminDatabaseRow {
  id: string;
  full_name: string;
  phone_number: string | null;
  staff_id: string | null;
  password_hash: string;
}

export async function authenticateSuperAdmin(
  identifier: string,
  password: string,
): Promise<SuperAdminAccount | null> {
  if (
    typeof identifier !== "string" ||
    typeof password !== "string" ||
    identifier.trim().length < 1 ||
    identifier.trim().length > 40 ||
    password.length < 1 ||
    password.length > 1024
  ) {
    return null;
  }

  const normalizedIdentifier = identifier.trim();

  const result = await databasePool.query<SuperAdminDatabaseRow>(
    `SELECT id, full_name, phone_number, staff_id, password_hash
     FROM platform_users
     WHERE role = 'SUPER_ADMIN'
       AND is_active = TRUE
       AND (
         UPPER(staff_id) = UPPER($1)
         OR phone_number = $1
       )
     LIMIT 1`,
    [normalizedIdentifier],
  );

  const account = result.rows[0];

  // Existing phone-based login must keep working when staff_id is not assigned.
  if (!account || !account.phone_number) {
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
    staffId: account.staff_id,
  };
}

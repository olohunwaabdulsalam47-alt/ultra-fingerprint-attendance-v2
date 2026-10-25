import { databasePool } from "../config/database.js";
import { hashPassword } from "../auth/crypto.js";

const STAFF_ID = "OLOHUNWA";

async function bootstrapSuperAdmin(): Promise<void> {
  const fullName = process.env.BOOTSTRAP_SUPERADMIN_NAME?.trim();
  const phoneNumber = process.env.BOOTSTRAP_SUPERADMIN_PHONE?.trim();
  const password = process.env.BOOTSTRAP_SUPERADMIN_PASSWORD;

  if (!fullName || fullName.length > 150) {
    throw new Error(
      "BOOTSTRAP_SUPERADMIN_NAME is missing or invalid.",
    );
  }

  if (!phoneNumber || !/^\+[1-9][0-9]{7,14}$/.test(phoneNumber)) {
    throw new Error(
      "BOOTSTRAP_SUPERADMIN_PHONE must use international format.",
    );
  }

  if (
    !password ||
    password.length < 14 ||
    password.length > 1024 ||
    password === "321930"
  ) {
    throw new Error(
      "Use a unique password of at least 14 characters.",
    );
  }

  const passwordHash = await hashPassword(password);
  const client = await databasePool.connect();

  try {
    await client.query("BEGIN");

    // Prevent two bootstrap runs from creating accounts concurrently.
    await client.query(
      "SELECT pg_advisory_xact_lock($1::bigint)",
      ["728194620135"],
    );

    const existing = await client.query(
      `SELECT id
       FROM platform_users
       WHERE role = 'SUPER_ADMIN'
       LIMIT 1`,
    );

    if (existing.rowCount !== 0) {
      throw new Error(
        "A SuperAdmin already exists. Bootstrap has been refused.",
      );
    }

    await client.query(
      `INSERT INTO platform_users (
         full_name,
         password_hash,
         role,
         is_active,
         phone_number,
         staff_id
       )
       VALUES ($1, $2, 'SUPER_ADMIN', TRUE, $3, $4)`,
      [fullName, passwordHash, phoneNumber, STAFF_ID],
    );

    await client.query("COMMIT");

    console.log(
      "Initial SuperAdmin account created successfully.",
    );
    console.log(`Staff ID: ${STAFF_ID}`);
    console.log("Password and phone number were not logged.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

try {
  await bootstrapSuperAdmin();
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "SuperAdmin bootstrap failed.",
  );
  process.exitCode = 1;
} finally {
  await databasePool.end();
  }

import "dotenv/config";
import { readFile } from "node:fs/promises";
import { databasePool } from "./database.js";

async function runMigration(): Promise<void> {
  const migrationUrl = new URL(
    "../../migrations/001_initial_schema.sql",
    import.meta.url,
  );

  const migrationSql = await readFile(migrationUrl, "utf8");

  if (!migrationSql.trim()) {
    throw new Error("The database migration file is empty.");
  }

  const client = await databasePool.connect();

  try {
    await client.query(migrationSql);
    console.log("Database migration completed successfully.");
  } finally {
    client.release();
  }
}

try {
  await runMigration();
} catch {
  console.error(
    "Database migration failed. Check the database connection and migration configuration.",
  );

  process.exitCode = 1;
} finally {
  await databasePool.end();
}

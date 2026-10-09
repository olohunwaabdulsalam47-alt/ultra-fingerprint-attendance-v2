import "dotenv/config";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not configured. Set it in the backend environment.",
  );
}

const isProduction = process.env.NODE_ENV === "production";

export const databasePool = new Pool({
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ...(isProduction
    ? {
        ssl: {
          rejectUnauthorized: true,
        },
      }
    : {}),
});

databasePool.on("error", () => {
  console.error("Unexpected error on an idle PostgreSQL connection.");
});

export async function checkDatabaseConnection(): Promise<void> {
  const client = await databasePool.connect();

  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}

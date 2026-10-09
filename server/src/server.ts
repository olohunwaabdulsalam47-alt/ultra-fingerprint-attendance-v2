import "dotenv/config";
import app from "./app.js";

const configuredPort = Number(process.env.PORT ?? 3000);

if (
  !Number.isInteger(configuredPort) ||
  configuredPort < 1 ||
  configuredPort > 65535
) {
  throw new Error("PORT must be a valid TCP port between 1 and 65535.");
}

const server = app.listen(configuredPort, "0.0.0.0", () => {
  console.log(`Ultra Fingerprint Attendance API listening on port ${configuredPort}.`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received. Shutting down API server.`);

  server.close((error) => {
    if (error) {
      console.error("API server shutdown failed.");
      process.exitCode = 1;
      return;
    }

    process.exitCode = 0;
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

server.on("error", () => {
  console.error("API server failed to start or encountered a server error.");
  process.exitCode = 1;
});

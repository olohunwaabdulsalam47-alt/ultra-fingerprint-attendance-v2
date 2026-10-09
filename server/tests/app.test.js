import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "../dist/app.js";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Unable to determine the test server address.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
});

test("GET /api/health returns a successful health response", async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);

  const body = await response.json();

  assert.equal(body.success, true);
  assert.equal(
    body.message,
    "Ultra Fingerprint Attendance API is running.",
  );

  assert.equal(typeof body.timestamp, "string");
  assert.ok(Number.isFinite(Date.parse(body.timestamp)));
});

test("unknown API routes return a 404 response", async () => {
  const response = await fetch(`${baseUrl}/api/does-not-exist`);

  assert.equal(response.status, 404);

  const body = await response.json();

  assert.equal(body.success, false);
  assert.equal(body.message, "API endpoint not found.");
});

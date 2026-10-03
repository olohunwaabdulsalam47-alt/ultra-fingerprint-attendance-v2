import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { openDatabase } from "../../../data/db/openDatabase";
import { getAuditEvents } from "../../../data/repositories/auditEventRepository";
import { recordAuditEvent } from "../audit/auditService";

async function clearAuditEvents(): Promise<void> {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      "auditEvents",
      "readwrite",
    );

    const store =
      transaction.objectStore("auditEvents");

    store.clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error);
    transaction.onabort = () =>
      reject(
        transaction.error ??
          new Error("Transaction aborted"),
      );
  });

  db.close();
}

describe("biometric audit logging", () => {
  beforeEach(async () => {
    await clearAuditEvents();
  });

  it("records a biometric registration audit event", async () => {
    await recordAuditEvent(
      "user-1",
      "BIOMETRIC_REGISTERED",
      "Registered a biometric credential for Test User.",
    );

    const events = await getAuditEvents();

    expect(events).toHaveLength(1);
    expect(events[0]?.userId).toBe("user-1");
    expect(events[0]?.action).toBe(
      "BIOMETRIC_REGISTERED",
    );
    expect(events[0]?.description).toContain(
      "biometric credential",
    );
  });
});

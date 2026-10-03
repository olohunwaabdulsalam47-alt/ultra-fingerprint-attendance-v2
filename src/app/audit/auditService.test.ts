import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { openDatabase } from "../../../data/db/openDatabase";
import { getAuditEvents } from "../../../data/repositories/auditEventRepository";
import { recordAuditEvent } from "./auditService";

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

describe("audit service", () => {
  beforeEach(async () => {
    await clearAuditEvents();
  });

  it("records and stores an audit event", async () => {
    const event = await recordAuditEvent(
      "user-1",
      "TEST_ACTION",
      "Test audit event",
    );

    const events = await getAuditEvents();

    const savedEvent = events.find(
      (item) =>
        item.auditEventId === event.auditEventId,
    );

    expect(savedEvent).toBeDefined();
    expect(savedEvent?.userId).toBe("user-1");
    expect(savedEvent?.action).toBe(
      "TEST_ACTION",
    );
    expect(savedEvent?.description).toBe(
      "Test audit event",
    );
    expect(savedEvent?.createdAt).toBeTruthy();
  });
});

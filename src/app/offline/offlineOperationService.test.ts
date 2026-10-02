import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { openDatabase } from "../../../data/db/openDatabase";
import {
  getOfflineOperations,
} from "../../../data/repositories/offlineOperationRepository";
import {
  markOfflineOperationCompleted,
  markOfflineOperationFailed,
  queueOfflineOperation,
} from "./offlineOperationService";

async function clearOfflineOperations(): Promise<void> {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      "offlineOperations",
      "readwrite",
    );

    const store = transaction.objectStore(
      "offlineOperations",
    );

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

describe("offline operation service", () => {
  beforeEach(async () => {
    await clearOfflineOperations();
  });

  it("creates and stores a pending offline operation", async () => {
    const operation = await queueOfflineOperation(
      "TEST_OPERATION",
      {
        message: "test",
      },
    );

    const operations =
      await getOfflineOperations();

    const savedOperation = operations.find(
      (item) =>
        item.operationId === operation.operationId,
    );

    expect(savedOperation).toBeDefined();
    expect(savedOperation?.type).toBe(
      "TEST_OPERATION",
    );
    expect(savedOperation?.status).toBe("pending");
    expect(savedOperation?.payload).toBe(
      JSON.stringify({
        message: "test",
      }),
    );
  });

  it("marks an operation as completed", async () => {
    const operation = await queueOfflineOperation(
      "COMPLETE_TEST",
      {
        value: true,
      },
    );

    await markOfflineOperationCompleted(operation);

    const operations =
      await getOfflineOperations();

    const updatedOperation = operations.find(
      (item) =>
        item.operationId === operation.operationId,
    );

    expect(updatedOperation?.status).toBe(
      "completed",
    );
  });

  it("marks an operation as failed", async () => {
    const operation = await queueOfflineOperation(
      "FAILED_TEST",
      {
        value: false,
      },
    );

    await markOfflineOperationFailed(operation);

    const operations =
      await getOfflineOperations();

    const updatedOperation = operations.find(
      (item) =>
        item.operationId === operation.operationId,
    );

    expect(updatedOperation?.status).toBe("failed");
  });
});

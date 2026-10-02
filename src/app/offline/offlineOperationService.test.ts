import { describe, expect, it } from "vitest";
import {
  markOfflineOperationCompleted,
  markOfflineOperationFailed,
  queueOfflineOperation,
} from "./offlineOperationService";

describe("offline operation service", () => {
  it("creates a pending offline operation", async () => {
    const operation = await queueOfflineOperation(
      "TEST_OPERATION",
      {
        message: "test",
      },
    );

    expect(operation.operationId).toBeTruthy();
    expect(operation.type).toBe("TEST_OPERATION");
    expect(operation.status).toBe("pending");
    expect(operation.payload).toBe(
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

    expect(operation.status).toBe("pending");
  });

  it("marks an operation as failed", async () => {
    const operation = await queueOfflineOperation(
      "FAILED_TEST",
      {
        value: false,
      },
    );

    await markOfflineOperationFailed(operation);

    expect(operation.status).toBe("pending");
  });
});

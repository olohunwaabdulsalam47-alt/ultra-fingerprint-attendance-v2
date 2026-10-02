import type { OfflineOperation } from "../../../domain/entities/offlineOperation";
import {
  getOfflineOperations,
  saveOfflineOperation,
  updateOfflineOperation,
} from "../../../data/repositories/offlineOperationRepository";

export async function queueOfflineOperation(
  type: string,
  payload: unknown,
): Promise<OfflineOperation> {
  const now = new Date().toISOString();

  const operation: OfflineOperation = {
    operationId: crypto.randomUUID(),
    type,
    payload: JSON.stringify(payload),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await saveOfflineOperation(operation);

  return operation;
}

export async function getPendingOfflineOperations(): Promise<
  OfflineOperation[]
> {
  const operations = await getOfflineOperations();

  return operations.filter(
    (operation) => operation.status === "pending",
  );
}

export async function markOfflineOperationCompleted(
  operation: OfflineOperation,
): Promise<void> {
  await updateOfflineOperation({
    ...operation,
    status: "completed",
    updatedAt: new Date().toISOString(),
  });
}

export async function markOfflineOperationFailed(
  operation: OfflineOperation,
): Promise<void> {
  await updateOfflineOperation({
    ...operation,
    status: "failed",
    updatedAt: new Date().toISOString(),
  });
}

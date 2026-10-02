import {
  getPendingOfflineOperations,
  markOfflineOperationCompleted,
  markOfflineOperationFailed,
} from "./offlineOperationService";

let syncing = false;

export async function syncOfflineOperations(): Promise<void> {
  if (syncing || !navigator.onLine) {
    return;
  }

  syncing = true;

  try {
    const operations =
      await getPendingOfflineOperations();

    for (const operation of operations) {
      try {
        JSON.parse(operation.payload);

        await markOfflineOperationCompleted(
          operation,
        );
      } catch {
        await markOfflineOperationFailed(
          operation,
        );
      }
    }
  } finally {
    syncing = false;
  }
}

export function startOfflineSync(): () => void {
  const handleOnline = () => {
    void syncOfflineOperations();
  };

  window.addEventListener("online", handleOnline);

  if (navigator.onLine) {
    void syncOfflineOperations();
  }

  return () => {
    window.removeEventListener(
      "online",
      handleOnline,
    );
  };
}

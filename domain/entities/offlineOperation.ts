export type OfflineOperationStatus =
  | "pending"
  | "completed"
  | "failed";

export interface OfflineOperation {
  operationId: string;
  type: string;
  payload: string;
  status: OfflineOperationStatus;
  createdAt: string;
  updatedAt: string;
}

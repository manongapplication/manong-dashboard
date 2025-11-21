export const ServiceRequestStatus = {
  AwaitingAcceptance: "awaitingAcceptance",
  Accepted: "accepted",
  InProgress: "inProgress",
  Completed: "completed",
  Failed: "failed",
  Cancelled: "cancelled",
  Rejected: "rejected",
  Paused: "paused",
  Pending: "pending",
  Expired: "expired",
  Refunding: "refunding",
} as const;

export type ServiceRequestStatus =
  (typeof ServiceRequestStatus)[keyof typeof ServiceRequestStatus];

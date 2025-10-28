export const VerificationStatus = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
} as const;

export type VerificationStatus =
  (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const TransactionType = {
  Payment: "payment",
  Refund: "refund",
  Adjustment: "adjustment",
  Failed: "failed",
  Refunded: "refunded",
} as const;

export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];

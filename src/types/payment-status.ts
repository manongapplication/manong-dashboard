export const PaymentStatus = {
  Unpaid: "unpaid",
  Pending: "pending",
  Paid: "paid",
  Failed: "failed",
  Refunded: "refunded",
} as const;

export type PaymentStatus =
  (typeof PaymentStatus)[keyof typeof PaymentStatus];

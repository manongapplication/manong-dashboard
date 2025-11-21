export const RefundStatus = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
  Processed: "processed",
} as const;

export type RefundStatus =
  (typeof RefundStatus)[keyof typeof RefundStatus];

function toReadable(value: string) {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
}

export const refundStatusOptions = Object.entries(RefundStatus).map(
  ([, value]) => ({
    label: toReadable(value),
    value,
  })
);
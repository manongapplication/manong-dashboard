export const WalletTransactionType = {
  topup: "topup",
  earning: "earning",
  job_fee: "job_fee",
  payout: "payout",
  adjustment: "adjustment",
  refund: "refund",
} as const;

export type WalletTransactionType =
  (typeof WalletTransactionType)[keyof typeof WalletTransactionType];
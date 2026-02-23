export const WalletTransactionStatus = {
  pending: 'pending',
  completed: 'completed',
  failed: 'failed'
}

export type WalletTransactionStatus =
  (typeof WalletTransactionStatus)[keyof typeof WalletTransactionStatus];
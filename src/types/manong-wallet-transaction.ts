import type { ManongWallet } from "./manong-wallet";
import type { WalletTransactionStatus } from "./wallet-transaction-status";
import type { WalletTransactionType } from "./wallet-transaction-type";

export interface ManongWalletTransaction {
  id: number;
  walletId: number;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  amount: number;
  currency: string;
  description?: string | null;
  metadata?: string | null; // JSON string
  
  // Relations
  wallet?: ManongWallet;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// For payout-specific view
export interface PayoutTransaction extends ManongWalletTransaction {
  // Additional payout-specific properties extracted from metadata
  payoutMethod?: 'gcash' | 'bank' | 'cash';
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  referenceNumber?: string;
  failureReason?: string;
}
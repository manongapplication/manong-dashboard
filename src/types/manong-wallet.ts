import type { AppUser } from "./app-user";
import type { ManongWalletTransaction } from "./manong-wallet-transaction";

export interface ManongWallet {
  id: number;
  manongId: number;
  balance: number;
  pending: number;
  locked: number;
  currency: string;
  
  // Relations
  manong?: AppUser;
  transactions?: ManongWalletTransaction[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
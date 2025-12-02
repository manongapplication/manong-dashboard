import type { PaymentStatus } from "./payment-status";
import type { TransactionType } from "./transaction-type";

export interface PaymentTransaction {
  id: number;
  serviceRequestId: number;
  userId: number;
  provider: string;
  paymentIntentId?: string;
  paymentIdOnGateway?: string;
  refundIdOnGateway?: string;
  handledManually: boolean;
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: TransactionType;
  description?: string;
  metadata?: string;

  createdAt?: Date;
  updatedAt?: Date;
  seenAt?: Date;
}
import type { AppUser } from "./app-user";
import type { PaymentTransaction } from "./payment-transaction";
import type { RefundStatus } from "./refund-status";
import type { ServiceRequest } from "./service-request";

export interface RefundRequest {
  id: number;
  serviceRequestId: number;
  userId: number;
  paymentTransactionId?: number | null | undefined;
  reason: string | null;
  evidenceUrl?: string | null;
  status: RefundStatus;
  handledManually: boolean;
  reviewedBy?: number | null;
  remarks?: string | null;

  serviceRequest?: ServiceRequest;

  paymentTransaction?: PaymentTransaction;

  createdAt: Date;
  updatedAt: Date;

  user?: AppUser;
}
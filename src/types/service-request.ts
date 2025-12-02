import type { AppUser } from "./app-user";
import type { PaymentStatus } from "./payment-status";
import type { PaymentTransaction } from "./payment-transaction";
import { ServiceRequestStatus } from "./service-request-status";

export interface ServiceRequest {
  id: number;
  requestNumber: string;
  userId: number;
  manongId?: number;
  serviceItemId: number;
  subServiceItemId?: number;
  paymentMethodId?: number;
  urgencyLevelId?: number;
  otherServiceName?: string;
  serviceDetails?: string;
  imagesPath?: string;

  customerFullAddress?: string;
  customerLat: number;
  customerLng: number;
  createdAt?: Date;
  updatedAt?: Date;

  notes?: string;
  status?: ServiceRequestStatus
  total?: number;
  paymentStatus: PaymentStatus;
  paymentTransactions?: PaymentTransaction[];

  manong?: AppUser;
  user?: AppUser;
}
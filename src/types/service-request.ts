import type { AppUser } from "./app-user";
import type { PaymentMethod } from "./payment-method";
import type { PaymentStatus } from "./payment-status";
import type { PaymentTransaction } from "./payment-transaction";
import type { ServiceItem } from "./service-item";
import { ServiceRequestStatus } from "./service-request-status";
import type { SubServiceItem } from "./sub-service-item";
import type { UrgencyLevel } from "./urgency-level";

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
  acceptedAt?: Date;
  completedAt?: Date;
  startedAt?: Date;
  cancelledAt?: Date;

  notes?: string;
  status?: ServiceRequestStatus
  total?: number;
  paymentStatus: PaymentStatus;
  paymentTransactions?: PaymentTransaction[];
  subServiceItem?: SubServiceItem;
  serviceItem?: ServiceItem;
  paymentMethod?: PaymentMethod;
  urgencyLevel?: UrgencyLevel;

  manong?: AppUser;
  user?: AppUser;
}
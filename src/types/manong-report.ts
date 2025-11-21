import type { AppUser } from "./app-user";
import type { ServiceRequest } from "./service-request";

export interface ManongReport {
  id: number;
  serviceRequestId: number;
  manongId: number;
  summary: string;
  details?: string | null;
  materialsUsed?: string | null;
  laborDuration?: number | null;
  imagesPath?: string | null; // JSON string array of image paths
  issuesFound?: string | null;
  customerPresent?: boolean | null;
  verifiedByUser?: boolean | null;
  totalCost?: number | null;
  warrantyInfo?: string | null;
  recommendations?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  serviceRequest?: ServiceRequest;
  manong?: AppUser;
}

// For form updates
export interface UpdateManongReportData {
  summary?: string;
  details?: string;
  materialsUsed?: string;
  laborDuration?: number;
  issuesFound?: string;
  customerPresent?: boolean;
  verifiedByUser?: boolean;
  totalCost?: number;
  warrantyInfo?: string;
  recommendations?: string;
}
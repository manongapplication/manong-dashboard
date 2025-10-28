import type { VerificationStatus } from "./verification-status";

export interface ProviderVerification {
  id: number;
  userId: number;       
  documentType: string
  documentUrl: string
  status: VerificationStatus;      
  reviewedBy: number;

  createdAt: Date;
  updatedAt: Date;
}
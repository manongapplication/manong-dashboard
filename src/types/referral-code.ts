import type { AppUser } from "./app-user";

export interface ReferralCode {
  id: number;
  code: string;
  ownerId: number;
  createdAt: Date;

  // Relations
  owner?: AppUser;
  usages?: ReferralCodeUsage[];
}

export interface ReferralCodeUsage {
  id: number;
  referralCodeId: number;
  userId?: number;
  deviceId: string;
  createdAt: Date;

  // Relations
  influencerCode?: ReferralCode;
  user?: AppUser;
}

// For form creation/update
export interface CreateReferralCodeData {
  code: string;
  ownerId: number;
}

export interface UpdateReferralCodeData {
  code: string;
  ownerId: number;
}
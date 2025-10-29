import type { ProviderVerification } from "./provider-verification";

export interface AppUser {
  id: number;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  email?: string;
  phone: string;
  profilePhoto?: string | null;
  addressLine?: string;
  status: string;

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;

  providerVerifications?: ProviderVerification[];
}
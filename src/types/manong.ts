import type { ManongProfile } from "./manong-profile";
import type { AppUser } from "./app-user";
import type { ProviderVerification } from "./provider-verification";

export interface Manong {
  id: number;
  user: AppUser;
  manongProfile: ManongProfile;
  providerVerifications?: ProviderVerification[];
  stats?: {
    completedServices: number;
    averageRating: number;
    ratingCount: number;
  };
}
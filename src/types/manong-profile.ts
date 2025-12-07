import type { ManongAssistant } from "./manong-assistant";
import type { ManongSpeciality } from "./manong-speciality";

export interface ManongProfile {
  id: number;
  userId: number;
  status: string;
  licenseNumber?: string;
  yearsExperience?: number;
  hourlyRate?: number;
  startingPrice?: number;
  isProfessionallyVerified: boolean;
  experienceDescription?: string;
  manongSpecialities?: ManongSpeciality[];
  manongAssistants?: ManongAssistant[];
  dailyServiceLimit?: number;

  deletedAt?: Date;
}
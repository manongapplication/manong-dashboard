import type { SubServiceItem } from "./sub-service-item";

export interface ManongSpeciality {
  id: number;
  manongProfileId: number;
  subServiceItemId: number;

  updatedAt: Date;
  createdAt: Date;

  subServiceItem: SubServiceItem;
}
import type { ServiceItemStatus } from "./service-item-status";

export interface SubServiceItem {
  id: number;
  serviceItemId: number;
  title: string;
  iconName?: string | null;
  description?: string | null;
  cost?: number | null;
  fee?: number | null;
  gross?: number | null;
  status: ServiceItemStatus;

  /* For editing */
  markDelete?: boolean;
  markColorEditing?: boolean;

  createdAt: Date;
  updatedAt: Date;
}
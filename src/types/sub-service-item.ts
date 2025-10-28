export interface SubServiceItem {
  id: number;
  serviceItemId: number;
  title: string;
  iconName?: string | null;
  description?: string | null;
  cost?: number | null;
  fee?: number | null;
  gross?: number | null;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
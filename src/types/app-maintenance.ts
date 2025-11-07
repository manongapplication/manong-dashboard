export interface AppMaintenance {
  id: number;       
  isActive: boolean;
  startTime?: Date | null;
  endTime?: Date | null;
  message?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
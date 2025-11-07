export interface UrgencyLevel {
  id: number;
  level: string;
  time?: string | null;
  price?: number | null;

  createdAt?: Date;
  updatedAt?: Date;
}
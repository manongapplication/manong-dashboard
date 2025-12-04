export interface PaymentMethod {
  id: number;
  name: string; // e.g., "Cash", "GCash", "Credit Card", "PayMaya"
  code: string; // e.g., "cash", "gcash", "card", "paymaya"
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
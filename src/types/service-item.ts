import type { ServiceItemStatus } from './service-item-status';
import type { SubServiceItem } from './sub-service-item';
export interface ServiceItem {
  id: number;          
  title: string;
  description: string;
  priceMin: number;
  priceMax: number;
  ratePerKm: number;
  iconName?: string | null;
  iconColor: string;
  iconTextColor: string;
  status: ServiceItemStatus;

  /* For editing */
  markDelete?: boolean;
  markColorEditing?: boolean;

  subServiceItems: SubServiceItem[];
}
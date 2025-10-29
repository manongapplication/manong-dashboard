export const ServiceItemStatus = {
  Active: "active",
  Inactive: "inactive",
  ComingSoon: "comingSoon",
  Archived: "archived",
  Deleted: "deleted",
} as const;

export type ServiceItemStatus =
  (typeof ServiceItemStatus)[keyof typeof ServiceItemStatus];

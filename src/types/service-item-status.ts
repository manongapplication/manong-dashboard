export const ServiceItemStatus = {
  Active: "active",
  Inactive: "inactive",
  ComingSoon: "comingSoon",
  Archived: "archived",
  Deleted: "deleted",
} as const;

export type ServiceItemStatus =
  (typeof ServiceItemStatus)[keyof typeof ServiceItemStatus];

function toReadable(value: string) {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
}

export const serviceItemStatusOptions = Object.entries(ServiceItemStatus).map(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ([key, value]) => ({
    label: toReadable(value),
    value,
  })
);
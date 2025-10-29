export const colorOptions = [
  { value: '#80d8d6', label: 'Crystal Teal' },
  { value: '#04697D', label: 'Primary Color' },
  { value: '#034B57', label: 'Primary Dark' },
  { value: '#D8E5E7', label: 'Primary Light' },
  { value: '#8fd3e8', label: 'Sky Blue' },
] as const;

export type ColorOption = { value: string; label: string };
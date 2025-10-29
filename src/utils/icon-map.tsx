// src/utils/icon-map.tsx
import { Icon, type IconProps } from '@iconify/react';
import type { ElementType } from 'react';

/**
 * Returns a React component for a dynamic Iconify icon name
 */
export function getIconComponent(iconName?: string): ElementType {
  return (props: Omit<IconProps, 'icon'>) => (
    <Icon icon={iconName ?? 'mdi:help'} {...props} />
  );
}

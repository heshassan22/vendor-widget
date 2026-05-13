import type { WidgetTenantConfig } from '@/widget/types';

export function isOriginAllowed(config: WidgetTenantConfig): boolean {
  if (config.allowedOrigins.length === 0) {
    return true;
  }
  const origin = window.location.origin;
  return config.allowedOrigins.includes(origin) || config.allowedOrigins.includes('*');
}

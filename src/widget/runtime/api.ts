import type { WidgetTenantConfig } from '@/widget/types';

export async function fetchWidgetConfig(
  configUrl: string,
): Promise<WidgetTenantConfig | null> {
  try {
    const response = await fetch(configUrl, { credentials: 'omit' });
    if (response.ok === false) {
      console.warn('[uniwidget] config fetch failed', response.status);
      return null;
    }
    return (await response.json()) as WidgetTenantConfig;
  } catch (err) {
    console.warn('[uniwidget] config fetch error', err);
    return null;
  }
}

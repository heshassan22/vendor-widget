import { api, type ProductRule, type TenantDetail } from './client';

export type ConfigPatch = {
  primaryColor?: string;
  welcomeMessage?: string;
  buttonText?: string;
  launcherLabel?: string;
  allowedOrigins?: readonly string[];
  productRules?: readonly ProductRule[];
  environment?: 'production' | 'staging';
  channel?: 'stable' | 'beta' | 'dev';
};

export function patchTenantConfig(
  tenantId: string,
  patch: ConfigPatch,
): Promise<TenantDetail> {
  return api<{ tenant: TenantDetail }>(`/api/v1/tenants/${tenantId}/config`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  }).then((r) => r.tenant);
}

import { getTenant } from './tenants';
import type { ProductRule } from './client';

export type { ProductRule };

export async function listProductRules(tenantId: string): Promise<readonly ProductRule[]> {
  const tenant = await getTenant(tenantId);
  return tenant.productRules;
}

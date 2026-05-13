import {
  api,
  type CreatedTenant,
  type TenantDetail,
  type TenantSummary,
} from './client';

export function listTenants(): Promise<readonly TenantSummary[]> {
  return api<{ tenants: TenantSummary[] }>('/api/v1/tenants').then((r) => r.tenants);
}

export type CreateTenantInput = {
  name: string;
  brand: string;
  domain: string;
  plan?: 'starter' | 'growth' | 'enterprise';
  primaryColor?: string;
  welcomeMessage?: string;
  buttonText?: string;
  launcherLabel?: string;
  allowedOrigins?: readonly string[];
  channel?: 'stable' | 'beta' | 'dev';
};

export function createTenant(input: CreateTenantInput): Promise<CreatedTenant> {
  return api<{ tenant: CreatedTenant }>('/api/v1/tenants', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((r) => r.tenant);
}

export function getTenant(id: string): Promise<TenantDetail> {
  return api<{ tenant: TenantDetail }>(`/api/v1/tenants/${id}`).then((r) => r.tenant);
}

export type BulkRow = {
  name: string;
  brand: string;
  domain: string;
  plan?: 'starter' | 'growth' | 'enterprise';
};

export function bulkCreateTenants(rows: readonly BulkRow[]): Promise<readonly CreatedTenant[]> {
  return api<{ tenants: CreatedTenant[] }>('/api/v1/tenants/bulk', {
    method: 'POST',
    body: JSON.stringify({ rows }),
  }).then((r) => r.tenants);
}

export function getSnippet(tenantId: string): Promise<{
  snippet: string;
  domainScript: string;
  loaderUrl: string;
}> {
  return api(`/api/v1/snippet?tenantId=${encodeURIComponent(tenantId)}`);
}

import { api, type ApiKey } from './client';

export type SecurityAuditEntry = {
  date: string;
  action: string;
  actor: string;
};

export function listApiKeys(tenantId: string): Promise<readonly ApiKey[]> {
  return api<{ apiKeys: ApiKey[] }>(`/api/v1/tenants/${tenantId}/api-keys`).then(
    (r) => r.apiKeys,
  );
}

export function rotateApiKey(tenantId: string): Promise<{
  publicKey: string;
  secret: string;
}> {
  return api<{ apiKey: { publicKey: string; secret: string } }>(
    `/api/v1/tenants/${tenantId}/api-keys/rotate`,
    { method: 'POST' },
  ).then((r) => r.apiKey);
}

export async function listSecurityAudit(tenantId: string): Promise<readonly SecurityAuditEntry[]> {
  const keys = await listApiKeys(tenantId);
  return keys.flatMap((key) => {
    const entries: SecurityAuditEntry[] = [
      { date: key.createdAt, action: `Created API key ${key.publicKey}`, actor: 'system' },
    ];
    if (key.revokedAt !== null) {
      entries.push({
        date: key.revokedAt,
        action: `Revoked API key ${key.publicKey}`,
        actor: 'admin',
      });
    }
    return entries;
  });
}

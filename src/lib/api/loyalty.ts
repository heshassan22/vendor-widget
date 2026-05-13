import { api, type LiveEventRow } from './client';

export type LoyaltyEvent = LiveEventRow;

export function listLoyaltyEvents(tenantId: string, limit: number = 50): Promise<readonly LoyaltyEvent[]> {
  return api<{ events: LiveEventRow[] }>(
    `/api/v1/tenants/${tenantId}/events?limit=${limit}`,
  ).then((r) => r.events);
}

export function subscribeLiveEvents(
  tenantId: string,
  onEvent: (event: LiveEventRow) => void,
): () => void {
  const source = new EventSource(`/api/v1/tenants/${tenantId}/events/stream`, {
    withCredentials: true,
  });
  source.addEventListener('live', (raw) => {
    const data = (raw as MessageEvent<string>).data;
    try {
      onEvent(JSON.parse(data) as LiveEventRow);
    } catch {
      // ignore malformed
    }
  });
  return () => source.close();
}

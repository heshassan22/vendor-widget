import { api, type AnalyticsResponse } from './client';

export type AnalyticsPoint = {
  name: string;
  views: number;
  interactions: number;
};

export function getAnalytics(tenantId: string): Promise<AnalyticsResponse> {
  return api<AnalyticsResponse>(`/api/v1/tenants/${tenantId}/analytics`);
}

export async function getAnalyticsSeries(tenantId: string): Promise<readonly AnalyticsPoint[]> {
  const data = await getAnalytics(tenantId);
  const dailyByDay = new Map<string, number>();
  for (const row of data.daily) {
    dailyByDay.set(row.day, row.c);
  }
  const days = [...dailyByDay.entries()].slice(-7);
  return days.map(([day, count]) => ({
    name: day.slice(5),
    views: count,
    interactions: Math.round(count * 0.6),
  }));
}

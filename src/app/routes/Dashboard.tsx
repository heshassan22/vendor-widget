import { useEffect, useState } from 'react';
import { Globe, MessageSquare, User } from '@/lib/icons/icons';
import { KpiCard } from '@/components/common';
import { useActiveTenant } from '@/app/auth';
import { getAnalytics, type AnalyticsResponse } from '@/lib/api';
import { Card, Typography } from 'components/elements';

export default function Dashboard() {
  const { id: tenantId } = useActiveTenant();
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId === null) {
      return;
    }
    let cancelled = false;
    void getAnalytics(tenantId)
      .then((data) => {
        if (cancelled === false) {
          setAnalytics(data);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (cancelled === false) {
          setError(err.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const totalViews = analytics?.totals.find((t) => t.type === 'page_view')?.count ?? 0;
  const launcherOpens = analytics?.totals.find((t) => t.type === 'launcher_open')?.count ?? 0;
  const interactionRate = totalViews === 0 ? 0 : Math.round((launcherOpens / totalViews) * 1000) / 10;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          label="Total widget views"
          value={totalViews.toLocaleString()}
          hint="page_view events"
          icon={<Globe size={18} />}
        />
        <KpiCard
          label="Customers tracked"
          value={(analytics?.customerCount ?? 0).toLocaleString()}
          hint={`${analytics?.totalPoints ?? 0} pts banked`}
          icon={<User size={18} />}
        />
        <KpiCard
          label="Interaction rate"
          value={`${interactionRate}%`}
          hint={`${launcherOpens.toLocaleString()} launcher opens`}
          icon={<MessageSquare size={18} />}
        />
      </div>
      <Card className="space-y-2">
        <Typography as="h3" className="text-lg font-semibold text-slate-900">
          Daily volume (30d)
        </Typography>
        {error !== null && (
          <Typography className="text-sm text-red-600">{error}</Typography>
        )}
        {analytics === null && error === null && (
          <Typography className="text-sm text-slate-500">Loading…</Typography>
        )}
        {analytics !== null && analytics.daily.length === 0 && (
          <Typography className="text-sm text-slate-500">
            No events yet. Paste the snippet on a page (or open the demo) to see live data.
          </Typography>
        )}
        {analytics !== null && analytics.daily.length > 0 && (
          <div className="grid grid-cols-7 gap-1">
            {analytics.daily.slice(-14).map((row) => {
              const max = Math.max(...analytics.daily.map((r) => r.c));
              const height = max === 0 ? 4 : Math.max(4, Math.round((row.c / max) * 60));
              return (
                <div key={row.day} className="flex flex-col items-center gap-1">
                  <div
                    style={{ height: `${height}px` }}
                    className="w-full rounded bg-blue-500"
                    title={`${row.day}: ${row.c}`}
                  />
                  <span className="text-[10px] text-slate-500">{row.day.slice(5)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

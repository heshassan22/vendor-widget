import { useEffect, useState } from 'react';
import { getAnalyticsSeries, type AnalyticsPoint } from '@/lib/api';
import { useActiveTenant } from '@/app/auth';
import { Card, Typography } from 'components/elements';

export default function Analytics() {
  const { id: tenantId } = useActiveTenant();
  const [series, setSeries] = useState<readonly AnalyticsPoint[]>([]);

  useEffect(() => {
    if (tenantId === null) {
      return;
    }
    void getAnalyticsSeries(tenantId).then(setSeries);
  }, [tenantId]);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <Typography as="h3" className="text-lg font-semibold text-slate-900">
          Weekly trend
        </Typography>
      </div>
      {series.length === 0 ? (
        <Typography className="text-sm text-slate-500">
          No analytics yet. Open the demo page or paste the snippet on a real product page.
        </Typography>
      ) : (
        <div className="space-y-2">
          {series.map((item) => (
            <div key={item.name} className="grid grid-cols-[64px_1fr_80px] items-center gap-3 text-sm">
              <Typography className="text-slate-500">{item.name}</Typography>
              <div className="h-2 rounded bg-slate-100">
                <div
                  className="h-2 rounded bg-blue-600"
                  style={{ width: `${Math.min(item.views * 5, 100)}%` }}
                />
              </div>
              <Typography className="text-right text-slate-700">{item.views}</Typography>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

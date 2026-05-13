import { type ReactNode } from 'react';
import { Card, Typography } from 'components/elements';

type KpiCardProps = {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
  readonly icon: ReactNode;
};

export default function KpiCard({ label, value, hint, icon }: KpiCardProps) {
  return (
    <Card>
      <div className="mb-4 flex items-start justify-between">
        <div className="rounded-lg bg-slate-50 p-2 text-slate-700">{icon}</div>
        <span className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">{hint}</span>
      </div>
      <Typography className="text-sm text-slate-500">{label}</Typography>
      <Typography as="h3" className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </Typography>
    </Card>
  );
}


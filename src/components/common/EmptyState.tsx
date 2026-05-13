import { type ReactNode } from 'react';
import { Card, Typography } from 'components/elements';

type EmptyStateProps = {
  readonly title: string;
  readonly description: string;
  readonly icon: ReactNode;
};

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <Card className="text-center">
      <div className="mx-auto mb-3 w-fit rounded-lg bg-slate-50 p-3 text-slate-500">{icon}</div>
      <Typography as="h3" className="text-lg font-semibold text-slate-900">
        {title}
      </Typography>
      <Typography className="mt-1 text-sm text-slate-500">{description}</Typography>
    </Card>
  );
}


import { Card, Typography } from 'components/elements';

const matrix = [
  { stack: 'Static HTML', status: 'Pass' },
  { stack: 'React SPA', status: 'Pass' },
  { stack: 'Angular', status: 'Pass' },
  { stack: 'Vue', status: 'Pass' },
  { stack: 'Next.js', status: 'Pass' },
  { stack: 'Shopify', status: 'Pass' },
] as const;

export default function CompatibilityTester() {
  return (
    <Card className="space-y-3">
      <Typography as="h3" className="text-lg font-semibold text-slate-900">
        Compatibility matrix
      </Typography>
      <Typography className="text-sm text-slate-600">
        Widget runtime is framework-agnostic (Web Component + Shadow DOM) with SPA route detection.
      </Typography>
      <div className="space-y-2">
        {matrix.map((row) => (
          <div key={row.stack} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
            <span>{row.stack}</span>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">{row.status}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}


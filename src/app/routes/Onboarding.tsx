import { useState } from 'react';
import { CodeBlock } from '@/components/common';
import { createTenant, type CreatedTenant } from '@/lib/api';
import { useActiveTenant } from '@/app/auth';
import { Badge, Button, Card, Input, Typography } from 'components/elements';

const steps = ['Tenant info', 'Detection origin', 'Copy snippet', 'Verify install'] as const;

export default function Onboarding() {
  const { setId } = useActiveTenant();
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState('Vendor Mart EU');
  const [brand, setBrand] = useState('Vendor Mart');
  const [domain, setDomain] = useState('store.vendor.com');
  const [origin, setOrigin] = useState('https://store.vendor.com');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenant, setTenant] = useState<CreatedTenant | null>(null);

  const onContinue = async (): Promise<void> => {
    setError(null);
    if (stepIndex === 1) {
      setCreating(true);
      try {
        const created = await createTenant({
          name,
          brand,
          domain,
          allowedOrigins: origin.length > 0 ? [origin] : [],
        });
        setTenant(created);
        setId(created.id);
        setStepIndex(2);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setCreating(false);
      }
      return;
    }
    setStepIndex((value) => Math.min(value + 1, steps.length - 1));
  };

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {steps.map((step, index) => (
          <Badge key={step} className={index === stepIndex ? 'bg-blue-100 text-blue-700' : ''}>
            {index + 1}. {step}
          </Badge>
        ))}
      </div>
      {stepIndex === 0 && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Typography as="label" className="text-sm font-medium text-slate-700">
              Tenant name
            </Typography>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Typography as="label" className="text-sm font-medium text-slate-700">
              Brand displayed in widget
            </Typography>
            <Input value={brand} onChange={(event) => setBrand(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Typography as="label" className="text-sm font-medium text-slate-700">
              Vendor domain (used as the install identifier)
            </Typography>
            <Input value={domain} onChange={(event) => setDomain(event.target.value)} />
          </div>
        </div>
      )}
      {stepIndex === 1 && (
        <div className="space-y-3">
          <Typography className="text-sm text-slate-600">
            Allow-listed origin where this widget will load. Any other origin is rejected by the runtime.
          </Typography>
          <Input value={origin} onChange={(event) => setOrigin(event.target.value)} />
          {error !== null && <Typography className="text-sm text-red-600">{error}</Typography>}
        </div>
      )}
      {stepIndex === 2 && tenant !== null && (
        <div className="space-y-3">
          <Typography className="text-sm text-slate-600">
            Tenant <code>{tenant.id}</code> created. Paste this snippet into your store's
            &lt;head&gt;:
          </Typography>
          <CodeBlock code={tenant.snippet} />
          <Typography className="text-xs text-slate-500">
            Public key: <code>{tenant.publicKey}</code>
          </Typography>
        </div>
      )}
      {stepIndex === 3 && (
        <Typography className="text-sm text-slate-600">
          Visit the Integration page; events stream in live as soon as the snippet loads on a real
          product page.
        </Typography>
      )}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((value) => value - 1)}
        >
          Back
        </Button>
        <Button
          disabled={stepIndex === steps.length - 1 || creating}
          onClick={() => void onContinue()}
        >
          {creating ? 'Creating tenant…' : 'Continue'}
        </Button>
      </div>
    </Card>
  );
}

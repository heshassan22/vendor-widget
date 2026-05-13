import { useEffect, useMemo, useState } from 'react';
import { getTenant, patchTenantConfig, type TenantDetail } from '@/lib/api';
import { useActiveTenant } from '@/app/auth';
import { MockProductPage, WidgetPreview } from '@/components/widget-preview';
import { Button, Card, Input, Typography } from 'components/elements';

type WidgetFormState = {
  primaryColor: string;
  welcomeMessage: string;
  launcherLabel: string;
  buttonText: string;
  position: 'bottom-left' | 'bottom-right';
};

const DEFAULT_FORM: WidgetFormState = {
  primaryColor: '#2563eb',
  welcomeMessage: 'Earn loyalty points on this product',
  launcherLabel: 'Rewards',
  buttonText: 'See points',
  position: 'bottom-right',
};

function tenantToForm(tenant: TenantDetail): WidgetFormState {
  return {
    primaryColor: tenant.primaryColor,
    welcomeMessage: tenant.welcomeMessage,
    launcherLabel: tenant.launcherLabel,
    buttonText: tenant.buttonText,
    position: 'bottom-right',
  };
}

export default function Customize() {
  const { id: tenantId } = useActiveTenant();
  const [config, setConfig] = useState<WidgetFormState>(DEFAULT_FORM);
  const [initial, setInitial] = useState<WidgetFormState>(DEFAULT_FORM);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (tenantId === null) {
      return;
    }
    let cancelled = false;
    void getTenant(tenantId)
      .then((tenant) => {
        if (cancelled) {
          return;
        }
        const form = tenantToForm(tenant);
        setConfig(form);
        setInitial(form);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(initial), [config, initial]);

  const onSave = async (): Promise<void> => {
    if (tenantId === null) {
      return;
    }
    setStatus('saving');
    try {
      const tenant = await patchTenantConfig(tenantId, {
        primaryColor: config.primaryColor,
        welcomeMessage: config.welcomeMessage,
        launcherLabel: config.launcherLabel,
        buttonText: config.buttonText,
      });
      const form = tenantToForm(tenant);
      setInitial(form);
      setConfig(form);
      setStatus('saved');
      window.setTimeout(() => setStatus('idle'), 1500);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card className="space-y-3 lg:col-span-4">
        <Typography as="h3" className="text-lg font-semibold text-slate-900">
          Widget configuration
        </Typography>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase text-slate-500">Primary color</label>
          <Input
            value={config.primaryColor}
            onChange={(event) => setConfig({ ...config, primaryColor: event.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase text-slate-500">Welcome message</label>
          <Input
            value={config.welcomeMessage}
            onChange={(event) => setConfig({ ...config, welcomeMessage: event.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase text-slate-500">Launcher label</label>
          <Input
            value={config.launcherLabel}
            onChange={(event) => setConfig({ ...config, launcherLabel: event.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase text-slate-500">CTA text</label>
          <Input
            value={config.buttonText}
            onChange={(event) => setConfig({ ...config, buttonText: event.target.value })}
          />
        </div>
        <Button onClick={() => void onSave()} disabled={dirty === false || status === 'saving'}>
          {status === 'saving'
            ? 'Saving…'
            : status === 'saved'
              ? 'Saved'
              : status === 'error'
                ? 'Retry save'
                : 'Save changes'}
        </Button>
      </Card>
      <Card className="space-y-4 lg:col-span-8">
        <MockProductPage />
        <WidgetPreview {...config} />
      </Card>
    </div>
  );
}

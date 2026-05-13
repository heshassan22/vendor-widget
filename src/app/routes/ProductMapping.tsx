import { useEffect, useState } from 'react';
import { listProductRules, patchTenantConfig, type ProductRule } from '@/lib/api';
import { useActiveTenant } from '@/app/auth';
import { Button, Card, Input, Typography } from 'components/elements';

export default function ProductMapping() {
  const { id: tenantId } = useActiveTenant();
  const [rules, setRules] = useState<readonly ProductRule[]>([]);
  const [draft, setDraft] = useState<ProductRule>({ match: 'brand', value: '', points: 25 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenantId === null) {
      return;
    }
    void listProductRules(tenantId).then(setRules);
  }, [tenantId]);

  const addRule = async (): Promise<void> => {
    if (tenantId === null || draft.value.length === 0) {
      return;
    }
    const next = [...rules, draft];
    setSaving(true);
    try {
      const tenant = await patchTenantConfig(tenantId, { productRules: next });
      setRules(tenant.productRules);
      setDraft({ match: 'brand', value: '', points: 25 });
    } finally {
      setSaving(false);
    }
  };

  const removeRule = async (index: number): Promise<void> => {
    if (tenantId === null) {
      return;
    }
    const next = rules.filter((_, i) => i !== index);
    setSaving(true);
    try {
      const tenant = await patchTenantConfig(tenantId, { productRules: next });
      setRules(tenant.productRules);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="space-y-3">
      <Typography as="h3" className="text-lg font-semibold text-slate-900">
        Product detection rules
      </Typography>
      <Typography className="text-sm text-slate-600">
        Widget detects JSON-LD Product fields and only renders when one of these rules matches.
      </Typography>
      <div className="space-y-2">
        {rules.length === 0 && (
          <Typography className="text-sm text-slate-500">
            No rules yet. Add one below; with no rules the widget renders on any detected product.
          </Typography>
        )}
        {rules.map((rule, index) => (
          <div
            key={`${rule.match}-${rule.value}-${index}`}
            className="grid grid-cols-[100px_1fr_120px_80px] items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm"
          >
            <span className="font-mono text-xs uppercase text-slate-500">{rule.match}</span>
            <span className="font-medium">{rule.value}</span>
            <span>{rule.points} pts</span>
            <Button variant="secondary" onClick={() => void removeRule(index)} disabled={saving}>
              Remove
            </Button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[100px_1fr_120px_120px] items-center gap-3 rounded-lg border border-dashed border-slate-300 p-3">
        <select
          className="rounded border border-slate-300 px-2 py-1 text-sm"
          value={draft.match}
          onChange={(event) => setDraft({ ...draft, match: event.target.value as 'sku' | 'brand' })}
        >
          <option value="brand">brand</option>
          <option value="sku">sku</option>
        </select>
        <Input
          placeholder="e.g. Dove or UNI-001"
          value={draft.value}
          onChange={(event) => setDraft({ ...draft, value: event.target.value })}
        />
        <Input
          type="number"
          min={0}
          value={String(draft.points)}
          onChange={(event) =>
            setDraft({ ...draft, points: Number.parseInt(event.target.value, 10) || 0 })
          }
        />
        <Button onClick={() => void addRule()} disabled={saving || draft.value.length === 0}>
          Add rule
        </Button>
      </div>
    </Card>
  );
}

import { useEffect, useState } from 'react';
import {
  getTenant,
  listApiKeys,
  listSecurityAudit,
  patchTenantConfig,
  rotateApiKey,
  type ApiKey,
  type SecurityAuditEntry,
} from '@/lib/api';
import { useActiveTenant } from '@/app/auth';
import { Button, Card, Textarea, Typography } from 'components/elements';

export default function SecurityCenter() {
  const { id: tenantId } = useActiveTenant();
  const [keys, setKeys] = useState<readonly ApiKey[]>([]);
  const [audit, setAudit] = useState<readonly SecurityAuditEntry[]>([]);
  const [origins, setOrigins] = useState<string>('');
  const [rotated, setRotated] = useState<{ publicKey: string; secret: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async (id: string): Promise<void> => {
    const [tenant, apiKeys, log] = await Promise.all([
      getTenant(id),
      listApiKeys(id),
      listSecurityAudit(id),
    ]);
    setOrigins(tenant.allowedOrigins.join('\n'));
    setKeys(apiKeys);
    setAudit(log);
  };

  useEffect(() => {
    if (tenantId === null) {
      return;
    }
    void refresh(tenantId);
  }, [tenantId]);

  const onRotate = async (): Promise<void> => {
    if (tenantId === null) {
      return;
    }
    setBusy(true);
    try {
      const next = await rotateApiKey(tenantId);
      setRotated(next);
      await refresh(tenantId);
    } finally {
      setBusy(false);
    }
  };

  const onSaveOrigins = async (): Promise<void> => {
    if (tenantId === null) {
      return;
    }
    setBusy(true);
    try {
      const list = origins
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      await patchTenantConfig(tenantId, { allowedOrigins: list });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <Typography as="h3" className="text-lg font-semibold text-slate-900">
          API keys
        </Typography>
        <Typography className="text-sm text-slate-600">
          Public key is embedded in the widget. Secret is publishable (HMAC tampering check only).
          Rotating revokes all previous keys.
        </Typography>
        <div className="space-y-2">
          {keys.map((key) => (
            <div
              key={key.id}
              className="grid grid-cols-[1fr_120px_140px_120px] items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"
            >
              <code className="font-mono text-xs">{key.publicKey}</code>
              <span>{key.secretPreview}</span>
              <span className="text-slate-500">{new Date(key.createdAt).toLocaleString()}</span>
              <span className={key.revokedAt === null ? 'text-green-600' : 'text-red-600'}>
                {key.revokedAt === null ? 'active' : 'revoked'}
              </span>
            </div>
          ))}
        </div>
        <Button onClick={() => void onRotate()} disabled={busy}>
          {busy ? 'Working…' : 'Rotate API key'}
        </Button>
        {rotated !== null && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <Typography className="font-semibold text-amber-900">
              New key generated. The secret is shown once:
            </Typography>
            <code className="mt-2 block break-all font-mono text-xs">{rotated.publicKey}</code>
            <code className="mt-1 block break-all font-mono text-xs">{rotated.secret}</code>
            <Typography className="mt-2 text-xs text-amber-700">
              Existing widget configs auto-pick the latest active key on next config fetch.
            </Typography>
          </div>
        )}
      </Card>
      <Card className="space-y-3">
        <Typography as="h3" className="text-lg font-semibold text-slate-900">
          Allowed origins
        </Typography>
        <Typography className="text-sm text-slate-600">
          One origin per line. The widget refuses to render on any origin not in this list (use
          <code> * </code> to allow all during testing).
        </Typography>
        <Textarea
          rows={4}
          value={origins}
          onChange={(event) => setOrigins(event.target.value)}
        />
        <Button onClick={() => void onSaveOrigins()} disabled={busy}>
          {busy ? 'Saving…' : 'Save origins'}
        </Button>
      </Card>
      <Card className="space-y-2">
        <Typography as="h3" className="text-lg font-semibold text-slate-900">
          Audit log
        </Typography>
        {audit.length === 0 ? (
          <Typography className="text-sm text-slate-500">No audit entries yet.</Typography>
        ) : (
          audit.map((log) => (
            <div
              key={`${log.date}-${log.action}`}
              className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700"
            >
              <span className="font-mono text-xs text-slate-500">{log.date}</span> · {log.action}
              <span className="ml-2 text-xs text-slate-500">({log.actor})</span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

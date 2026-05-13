import { useEffect, useState } from 'react';
import {
  getTenant,
  listReleases,
  pinTenantChannel,
  type ReleaseChannel,
  type ReleaseEntry,
  type TenantDetail,
} from '@/lib/api';
import { useActiveTenant } from '@/app/auth';
import { Badge, Button, Card, Typography } from 'components/elements';

const CHANNELS: readonly ReleaseChannel[] = ['stable', 'beta', 'dev'];

export default function Releases() {
  const { id: tenantId } = useActiveTenant();
  const [releases, setReleases] = useState<readonly ReleaseEntry[]>([]);
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void listReleases().then(setReleases);
  }, []);

  useEffect(() => {
    if (tenantId === null) {
      return;
    }
    void getTenant(tenantId).then(setTenant);
  }, [tenantId]);

  const onPin = async (channel: ReleaseChannel): Promise<void> => {
    if (tenantId === null) {
      return;
    }
    setBusy(true);
    try {
      const next = await pinTenantChannel(tenantId, channel);
      setTenant(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <Typography as="h3" className="text-lg font-semibold text-slate-900">
          Channel pin for this tenant
        </Typography>
        <Typography className="text-sm text-slate-600">
          The widget reads <code>channel</code> from each tenant's config. Vendor sites pick up the
          new channel after the config's <code>stale-while-revalidate</code> window expires.
        </Typography>
        <div className="flex gap-2">
          {CHANNELS.map((channel) => (
            <Button
              key={channel}
              variant={tenant?.channel === channel ? 'primary' : 'secondary'}
              disabled={busy}
              onClick={() => void onPin(channel)}
            >
              {channel}
            </Button>
          ))}
        </div>
      </Card>
      <Card className="space-y-3">
        <Typography as="h3" className="text-lg font-semibold text-slate-900">
          Available widget versions
        </Typography>
        {releases.map((release) => (
          <div
            key={release.version}
            className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm"
          >
            <span>
              {release.version} · {release.date}
            </span>
            <Badge>{release.channel}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}

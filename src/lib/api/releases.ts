import { patchTenantConfig } from './configs';

export type ReleaseChannel = 'stable' | 'beta' | 'dev';

export type ReleaseEntry = {
  version: string;
  date: string;
  channel: ReleaseChannel;
};

const RELEASES: readonly ReleaseEntry[] = [
  { version: '1.3.2', date: '2026-04-22', channel: 'stable' },
  { version: '1.4.0-beta.2', date: '2026-04-26', channel: 'beta' },
  { version: '1.5.0-dev.5', date: '2026-04-29', channel: 'dev' },
];

export async function listReleases(): Promise<readonly ReleaseEntry[]> {
  return RELEASES;
}

export function pinTenantChannel(tenantId: string, channel: ReleaseChannel) {
  return patchTenantConfig(tenantId, { channel });
}

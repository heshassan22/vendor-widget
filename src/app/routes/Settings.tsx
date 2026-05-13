import { EmptyState } from '@/components/common';
import { Globe } from '@/lib/icons/icons';

export default function Settings() {
  return <EmptyState title="Settings" description="Advanced account settings can be extended from this module." icon={<Globe size={20} />} />;
}


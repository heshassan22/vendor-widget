import { type AppRouteId } from '@/app/types';
import { RoleSwitcher } from '@/app/layout';
import { Button, Typography } from 'components/elements';

type TopbarProps = {
  readonly route: AppRouteId;
  readonly role: 'vendor' | 'admin';
  readonly onRoleChange: (role: 'vendor' | 'admin') => void;
  readonly onLogout: () => void;
};

export default function Topbar({ route, role, onRoleChange, onLogout }: TopbarProps) {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div>
        <Typography as="h2" className="text-2xl font-bold capitalize text-slate-900">
          {route.replace('-', ' ')}
        </Typography>
        <Typography className="text-sm text-slate-500">Plan-aligned implementation for all seven challenges.</Typography>
      </div>
      <div className="flex items-center gap-3">
        <RoleSwitcher role={role} onRoleChange={onRoleChange} />
        <Button variant="secondary" onClick={onLogout}>
          Sign Out
        </Button>
      </div>
    </header>
  );
}


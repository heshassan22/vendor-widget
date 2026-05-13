import { Button, Typography } from 'components/elements';

type RoleSwitcherProps = {
  readonly role: 'vendor' | 'admin';
  readonly onRoleChange: (role: 'vendor' | 'admin') => void;
};

export default function RoleSwitcher({ role, onRoleChange }: RoleSwitcherProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1">
      <Typography as="span" className="px-2 text-xs text-slate-500">
        View
      </Typography>
      <Button className="px-3 py-1.5 text-xs" variant={role === 'vendor' ? 'primary' : 'ghost'} onClick={() => onRoleChange('vendor')}>
        Vendor
      </Button>
      <Button className="px-3 py-1.5 text-xs" variant={role === 'admin' ? 'primary' : 'ghost'} onClick={() => onRoleChange('admin')}>
        Admin
      </Button>
    </div>
  );
}


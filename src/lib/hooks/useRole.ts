import { useMemo, useState } from 'react';

export type AppRole = 'vendor' | 'admin';

type UseRoleResult = {
  role: AppRole;
  setRole: (value: AppRole) => void;
  isAdmin: boolean;
};

export function useRole(initialRole: AppRole): UseRoleResult {
  const [role, setRole] = useState<AppRole>(initialRole);
  const isAdmin = useMemo(() => role === 'admin', [role]);
  return { role, setRole, isAdmin };
}


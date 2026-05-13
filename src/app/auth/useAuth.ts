import { useCallback, useEffect, useState } from 'react';
import { ApiError, getMe, listTenants, loginRequest, logoutRequest } from '@/lib/api';
import type { SessionData } from '@/lib/utils';

type LoadState = 'idle' | 'loading' | 'ready';

type UseAuthResult = {
  session: SessionData | null;
  loadState: LoadState;
  activeTenantId: string | null;
  setActiveTenantId: (id: string | null) => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
};

export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);

  const ensureTenant = useCallback(async (currentTenantId: string | null): Promise<string | null> => {
    if (currentTenantId !== null) {
      return currentTenantId;
    }
    try {
      const tenants = await listTenants();
      return tenants[0]?.id ?? null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    setLoadState('loading');
    void getMe()
      .then(async ({ user }) => {
        const next: SessionData = {
          email: user.email,
          role: user.role,
          userId: user.id,
          tenantId: user.tenantId,
        };
        setSession(next);
        const id = await ensureTenant(user.tenantId);
        setActiveTenantId(id);
      })
      .catch(() => {
        setSession(null);
      })
      .finally(() => setLoadState('ready'));
  }, [ensureTenant]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { user } = await loginRequest(email, password);
      const next: SessionData = {
        email: user.email,
        role: user.role,
        userId: user.id,
        tenantId: user.tenantId,
      };
      setSession(next);
      const id = await ensureTenant(user.tenantId);
      setActiveTenantId(id);
      return { ok: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'login failed';
      return { ok: false, error: message };
    }
  }, [ensureTenant]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setSession(null);
      setActiveTenantId(null);
    }
  }, []);

  return { session, loadState, activeTenantId, setActiveTenantId, login, logout };
}

import { createContext, useContext } from 'react';

export { default as AuthScreen } from './AuthScreen';
export * from './useAuth';

export type AuthContextValue = {
  activeTenantId: string | null;
  setActiveTenantId: (id: string | null) => void;
  session: { email: string; role: 'admin' | 'vendor' } | null;
};

export const AuthContext = createContext<AuthContextValue>({
  activeTenantId: null,
  setActiveTenantId: () => undefined,
  session: null,
});

export function useActiveTenant(): { id: string | null; setId: (id: string | null) => void } {
  const ctx = useContext(AuthContext);
  return { id: ctx.activeTenantId, setId: ctx.setActiveTenantId };
}

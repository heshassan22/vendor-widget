import { useMemo, useState } from 'react';
import { AuthContext, AuthScreen, useAuth } from '@/app/auth';
import { Sidebar, Topbar } from '@/app/layout';
import {
  Analytics,
  BulkOnboarding,
  CompatibilityTester,
  Customize,
  Dashboard,
  Demo,
  Integration,
  Onboarding,
  ProductMapping,
  Releases,
  SecurityCenter,
  Settings,
} from '@/app/routes';
import type { AppRouteId } from '@/app/types';
import { useRole } from '@/lib/hooks';
import { RoleGate } from '@/components/common';

const routeList: readonly AppRouteId[] = [
  'dashboard',
  'analytics',
  'onboarding',
  'customize',
  'product-mapping',
  'integration',
  'compatibility',
  'demo',
  'releases',
  'bulk-onboarding',
  'security',
  'settings',
];

function renderRoute(route: AppRouteId): JSX.Element {
  const map: Record<AppRouteId, JSX.Element> = {
    dashboard: <Dashboard />,
    analytics: <Analytics />,
    onboarding: <Onboarding />,
    customize: <Customize />,
    'product-mapping': <ProductMapping />,
    integration: <Integration />,
    compatibility: <CompatibilityTester />,
    demo: <Demo />,
    releases: <Releases />,
    'bulk-onboarding': <BulkOnboarding />,
    security: <SecurityCenter />,
    settings: <Settings />,
  };
  return map[route];
}

export default function App() {
  const { session, loadState, activeTenantId, setActiveTenantId, login, logout } = useAuth();
  const { role, setRole } = useRole(session?.role ?? 'vendor');
  const [activeRoute, setActiveRoute] = useState<AppRouteId>('dashboard');

  const safeRoute = useMemo(() => {
    if (routeList.includes(activeRoute) === false) {
      return 'dashboard';
    }
    return activeRoute;
  }, [activeRoute]);

  if (loadState !== 'ready') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Loading…
      </div>
    );
  }

  if (session === null) {
    return <AuthScreen onLogin={login} />;
  }

  return (
    <AuthContext.Provider
      value={{
        activeTenantId,
        setActiveTenantId,
        session: { email: session.email, role: session.role },
      }}
    >
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <Sidebar activeRoute={safeRoute} onRouteChange={setActiveRoute} role={role} />
        <main className="ml-72 h-screen flex-1 overflow-y-auto p-8">
          <Topbar route={safeRoute} role={role} onRoleChange={setRole} onLogout={() => void logout()} />
          <RoleGate role={role} allow={['admin', 'vendor']}>
            {safeRoute === 'bulk-onboarding' && role !== 'admin' ? <Settings /> : renderRoute(safeRoute)}
          </RoleGate>
        </main>
      </div>
    </AuthContext.Provider>
  );
}

import { type AppRouteId } from '@/app/types';
import { BarChart3, Code, Eye, Globe, LayoutDashboard, Palette, Rocket, Shield, Upload, Users, WandSparkles } from '@/lib/icons/icons';
import { Button, Typography } from 'components/elements';
import type { ComponentType } from 'react';

type SidebarProps = {
  readonly activeRoute: AppRouteId;
  readonly onRouteChange: (route: AppRouteId) => void;
  readonly role: 'vendor' | 'admin';
};

type MenuItem = {
  id: AppRouteId;
  label: string;
  icon: ComponentType<{ size?: number }>;
  roles: readonly ('vendor' | 'admin')[];
};

const menuItems: readonly MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['vendor', 'admin'] },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['vendor', 'admin'] },
  { id: 'onboarding', label: 'Onboarding', icon: Rocket, roles: ['vendor', 'admin'] },
  { id: 'customize', label: 'Customize', icon: Palette, roles: ['vendor', 'admin'] },
  { id: 'product-mapping', label: 'Product Mapping', icon: WandSparkles, roles: ['vendor', 'admin'] },
  { id: 'integration', label: 'Integration', icon: Code, roles: ['vendor', 'admin'] },
  { id: 'compatibility', label: 'Compatibility', icon: Globe, roles: ['vendor', 'admin'] },
  { id: 'demo', label: 'Live Demo', icon: Eye, roles: ['vendor', 'admin'] },
  { id: 'releases', label: 'Releases', icon: Upload, roles: ['vendor', 'admin'] },
  { id: 'bulk-onboarding', label: 'Bulk Onboarding', icon: Users, roles: ['admin'] },
  { id: 'security', label: 'Security', icon: Shield, roles: ['vendor', 'admin'] },
  { id: 'settings', label: 'Settings', icon: LayoutDashboard, roles: ['vendor', 'admin'] },
];

export default function Sidebar({ activeRoute, onRouteChange, role }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-72 flex-col border-r border-slate-800 bg-slate-900 px-4 py-6">
      <Typography as="h1" className="px-3 text-lg font-bold text-white">
        UniWidget Console
      </Typography>
      <Typography className="px-3 text-xs text-slate-400">One-script ecommerce loyalty widget</Typography>
      <nav className="mt-6 flex-1 space-y-2 overflow-y-auto">
        {menuItems
          .filter((item) => item.roles.includes(role))
          .map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`flex w-full items-center justify-start gap-2 text-left ${activeRoute === item.id ? 'bg-blue-600 text-white hover:bg-blue-600' : 'text-slate-300 hover:bg-slate-800'}`}
              onClick={() => onRouteChange(item.id)}
            >
              <item.icon size={16} />
              {item.label}
            </Button>
          ))}
      </nav>
    </aside>
  );
}


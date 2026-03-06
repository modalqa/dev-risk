'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  GitBranch,
  AlertTriangle,
  Map,
  Settings,
  LogOut,
  ShieldAlert,
  ChevronRight,
  Plug,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  user: { name: string; email: string; role: string };
}

const navItems = [
  { href: '/dashboard',             label: 'Executive Dashboard', icon: LayoutDashboard },
  { href: '/releases',              label: 'Releases',            icon: GitBranch },
  { href: '/risks',                 label: 'Risk Management',     icon: AlertTriangle },
  { href: '/user-journey',          label: 'User Journey',        icon: Map },
  { href: '/settings/integrations', label: 'Integrations',        icon: Plug },
  { href: '/settings',              label: 'Settings',            icon: Settings, exact: true },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-surface border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-blue flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">DevRisk AI</p>
            <p className="text-[10px] text-gray-500 leading-tight">Risk Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = (item as any).exact 
            ? pathname === item.href 
            : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-primary/10 text-primary-light border border-primary/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-surface-2'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-primary-light' : 'text-gray-500 group-hover:text-gray-300')} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 text-primary-light" />}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-blue flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-white">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user.name}</p>
            <p className="text-[10px] text-gray-500 truncate">{user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

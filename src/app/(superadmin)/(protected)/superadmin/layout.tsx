import { redirect } from 'next/navigation';
import { getCurrentSuperAdmin } from '@/lib/auth';
import { ShieldCheck, LogOut, Users, Settings, Cpu, UserCheck } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from './LogoutButton';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentSuperAdmin();
  if (!admin) redirect('/superadmin/login');

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">DevRisk AI — Super Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{admin.email}</span>
          <LogoutButton />
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-surface-2 border-b border-border">
        <div className="flex px-6 space-x-6">
          <Link 
            href="/superadmin"
            className="flex items-center gap-2 py-3 px-1 border-b-2 border-transparent hover:border-orange-500 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <Users className="w-4 h-4" />
            Tenants
          </Link>
          <Link 
            href="/superadmin/leads"
            className="flex items-center gap-2 py-3 px-1 border-b-2 border-transparent hover:border-orange-500 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            Leads
          </Link>
          <Link 
            href="/superadmin/ai-providers"
            className="flex items-center gap-2 py-3 px-1 border-b-2 border-transparent hover:border-orange-500 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <Cpu className="w-4 h-4" />
            AI Providers
          </Link>
        </div>
      </nav>

      <main className="p-6">
        {children}
      </main>
    </div>
  );
}

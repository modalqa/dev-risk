import { redirect } from 'next/navigation';
import { getCurrentSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { getStatusBadgeClass, formatDate } from '@/lib/utils';
import { Building2, Users, BarChart3, GitBranch } from 'lucide-react';
import CreateTenantButton from './CreateTenantButton';
import TenantActions from './TenantActions';

async function getAdminData() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { users: true, risks: true, releases: true } },
    },
  });

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t: typeof tenants[0]) => t.status === 'ACTIVE').length;
  const totalUsers = tenants.reduce((s: number, t: typeof tenants[0]) => s + t._count.users, 0);
  const totalRisks = tenants.reduce((s: number, t: typeof tenants[0]) => s + t._count.risks, 0);

  return { tenants, totalTenants, activeTenants, totalUsers, totalRisks };
}

export default async function SuperAdminPage() {
  const admin = await getCurrentSuperAdmin();
  if (!admin) redirect('/superadmin/login');

  const { tenants, totalTenants, activeTenants, totalUsers, totalRisks } = await getAdminData();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Global Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all tenants and platform health</p>
        </div>
        <CreateTenantButton />
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Tenants', value: totalTenants, icon: Building2, color: 'text-white' },
          { label: 'Active Tenants', value: activeTenants, icon: Building2, color: 'text-emerald-400' },
          { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-blue-400' },
          { label: 'Total Risks', value: totalRisks, icon: BarChart3, color: 'text-orange-400' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-start justify-between">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
                <Icon className="w-4 h-4 text-gray-600" />
              </div>
              <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tenants list */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-white">All Tenants</h3>
        </div>
        <div className="divide-y divide-border">
          {tenants.map((tenant: typeof tenants[0]) => (
            <div key={tenant.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-2 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0 border border-border">
                <Building2 className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{tenant.name}</span>
                  <Badge className={getStatusBadgeClass(tenant.status)} size="sm">{tenant.status}</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">{tenant.slug}</p>
              </div>
              <div className="hidden sm:flex items-center gap-6 text-center flex-shrink-0">
                <div>
                  <p className="text-sm font-medium text-white">{tenant._count.users}</p>
                  <p className="text-[10px] text-gray-500">Users</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{tenant._count.releases}</p>
                  <p className="text-[10px] text-gray-500">Releases</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{tenant._count.risks}</p>
                  <p className="text-[10px] text-gray-500">Risks</p>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-gray-600">{formatDate(tenant.createdAt)}</p>
              </div>
              <TenantActions tenantId={tenant.id} currentStatus={tenant.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

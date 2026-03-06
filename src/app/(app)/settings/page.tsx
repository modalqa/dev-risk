import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { prisma } from '@/lib/prisma';
import { getRoleBadgeClass, getStatusBadgeClass, formatDateTime } from '@/lib/utils';
import { Settings, Users, Shield } from 'lucide-react';
import AddUserButton from './AddUserButton';
import UserActions from './UserActions';
import AuditPagination from './AuditPagination';

const AUDIT_PAGE_SIZE = 15;

async function getTeamData(tenantId: string, auditPage: number) {
  const auditSkip = (auditPage - 1) * AUDIT_PAGE_SIZE;
  
  const [users, tenant, auditLogs, auditCount] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      skip: auditSkip,
      take: AUDIT_PAGE_SIZE,
    }),
    prisma.auditLog.count({ where: { tenantId } }),
  ]);
  return { users, tenant, auditLogs, auditCount };
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const auditPage = Math.max(1, parseInt(params.auditPage || '1', 10));
  
  const { users, tenant, auditLogs, auditCount } = await getTeamData(user.tenantId, auditPage);
  const auditTotalPages = Math.ceil(auditCount / AUDIT_PAGE_SIZE);

  return (
    <>
      <Header title="Settings" subtitle="Tenant and team management" />

      <div className="p-6 space-y-5">
        {/* Tenant info */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary-light" />
            <h3 className="text-sm font-semibold text-white">Tenant Information</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Tenant Name</p>
              <p className="text-sm font-medium text-white mt-0.5">{tenant?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Slug</p>
              <p className="text-sm font-mono text-gray-300 mt-0.5">{tenant?.slug}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <div className="mt-0.5">
                <Badge className={getStatusBadgeClass(tenant?.status ?? '')} size="sm">
                  {tenant?.status}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Team */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-light" />
              <h3 className="text-sm font-semibold text-white">Team Members</h3>
              <span className="text-xs text-gray-500">({users.length})</span>
            </div>
            {(user.role === 'OWNER' || user.role === 'ADMIN') && (
              <AddUserButton />
            )}
          </div>
          <div className="space-y-2">
            {users.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-surface-2 border border-border/50"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-accent-blue/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-white">{member.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{member.name}</span>
                    {member.id === user.userId && (
                      <span className="text-[10px] text-gray-500">(you)</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={getRoleBadgeClass(member.role)} size="sm">{member.role}</Badge>
                  {!member.isActive && (
                    <Badge className="bg-gray-500/20 text-gray-500 border border-gray-500/20" size="sm">Inactive</Badge>
                  )}
                  {user.role !== 'VIEWER' && member.id !== user.userId && (
                    <UserActions userId={member.id} currentRole={member.role} isActive={member.isActive} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Audit logs */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-white">Audit Log</h3>
              <span className="text-xs text-gray-500">({auditCount} entries)</span>
            </div>
          </div>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
          ) : (
            <>
              <div className="space-y-1.5">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-gray-300">
                        <span className="font-medium text-white">{log.action}</span>
                        {' '}on <span className="text-primary-light">{log.entity}</span>
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-600 flex-shrink-0">{formatDateTime(log.createdAt)}</span>
                  </div>
                ))}
              </div>
              
              {/* Audit Pagination */}
              {auditTotalPages > 1 && (
                <AuditPagination 
                  currentPage={auditPage}
                  totalPages={auditTotalPages}
                  totalItems={auditCount}
                  pageSize={AUDIT_PAGE_SIZE}
                />
              )}
            </>
          )}
        </Card>
      </div>
    </>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { MoreVertical, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';

interface TenantActionsProps {
  tenantId: string;
  currentStatus: string;
}

export default function TenantActions({ tenantId, currentStatus }: TenantActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    setOpen(false);
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await fetch(`/api/superadmin/tenants/${tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  };

  const remove = async () => {
    if (!confirm('Delete this tenant and all its data? This cannot be undone.')) return;
    setLoading(true);
    setOpen(false);
    await fetch(`/api/superadmin/tenants/${tenantId}`, { method: 'DELETE' });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-surface-3 transition-colors"
        disabled={loading}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-44 bg-surface border border-border rounded-xl shadow-xl py-1 overflow-hidden">
            <button
              onClick={toggle}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-300 hover:bg-surface-2 hover:text-white transition-colors"
            >
              {currentStatus === 'ACTIVE' ? (
                <>
                  <PauseCircle className="w-4 h-4 text-yellow-400" />
                  Suspend
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 text-emerald-400" />
                  Activate
                </>
              )}
            </button>
            <div className="my-1 border-t border-border" />
            <button
              onClick={remove}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Tenant
            </button>
          </div>
        </>
      )}
    </div>
  );
}

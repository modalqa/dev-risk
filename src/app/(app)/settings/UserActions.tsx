'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { MoreHorizontal, ShieldCheck, UserX, Trash2 } from 'lucide-react';

export default function UserActions({
  userId,
  currentRole,
  isActive,
}: {
  userId: string;
  currentRole: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function toggleActive() {
    await fetch(`/api/settings/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-gray-300 hover:bg-surface-3 transition-colors"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-20 bg-surface border border-border rounded-lg shadow-xl py-1 w-36">
            <button
              onClick={toggleActive}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-surface-2 transition-colors"
            >
              <UserX className="w-3 h-3" />
              {isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

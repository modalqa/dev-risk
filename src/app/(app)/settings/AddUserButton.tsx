'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { UserPlus } from 'lucide-react';

export default function AddUserButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '', name: '', password: '', role: 'VIEWER',
  });

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed'); return; }
      setOpen(false);
      router.refresh();
    } catch {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <UserPlus className="w-3.5 h-3.5" />
        Add Member
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Team Member">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Name *" placeholder="Full name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          <Input label="Email *" type="email" placeholder="email@company.com" value={form.email} onChange={(e) => set('email', e.target.value)} required />
          <Input label="Password *" type="password" placeholder="min 8 characters" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={8} />
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => set('role', e.target.value)}
            options={[
              { value: 'VIEWER', label: 'Viewer' },
              { value: 'ADMIN',  label: 'Admin' },
              { value: 'OWNER',  label: 'Owner' },
            ]}
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Add Member</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

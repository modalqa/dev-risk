'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Plus } from 'lucide-react';

export default function CreateTenantButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    tenantName: '',
    ownerEmail: '',
    ownerName: '',
    ownerPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create tenant');
      setOpen(false);
      setForm({ tenantName: '', ownerEmail: '', ownerName: '', ownerPassword: '' });
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="w-4 h-4 mr-1.5" />
        New Tenant
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Create New Tenant">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Tenant Name</label>
            <Input
              name="tenantName"
              value={form.tenantName}
              onChange={handleChange}
              placeholder="Acme Corporation"
              required
            />
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Owner Account</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
                <Input
                  name="ownerName"
                  value={form.ownerName}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                <Input
                  name="ownerEmail"
                  type="email"
                  value={form.ownerEmail}
                  onChange={handleChange}
                  placeholder="owner@acme.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
                <Input
                  name="ownerPassword"
                  type="password"
                  value={form.ownerPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating...' : 'Create Tenant'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

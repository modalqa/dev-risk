'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import TextEditor from '@/components/ui/TextEditor';
import { Plus } from 'lucide-react';

export default function AddReleaseButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    version: '',
    description: '',
    deploymentDate: new Date().toISOString().slice(0, 16),
    status: 'PENDING',
    prSize: '',
    reviewDurationHours: '',
    failedBuildRate: '',
    testCoverage: '',
    deploymentsPerWeek: '',
    reopenedIssues: '',
  });

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: form.version.trim(),
          description: form.description.trim() || null,
          deploymentDate: form.deploymentDate,
          status: form.status,
          prSize:              form.prSize              ? parseInt(form.prSize)              : null,
          reviewDurationHours: form.reviewDurationHours ? parseFloat(form.reviewDurationHours) : null,
          failedBuildRate:     form.failedBuildRate     ? parseFloat(form.failedBuildRate)     : null,
          testCoverage:        form.testCoverage        ? parseFloat(form.testCoverage)        : null,
          deploymentsPerWeek:  form.deploymentsPerWeek  ? parseInt(form.deploymentsPerWeek)    : null,
          reopenedIssues:      form.reopenedIssues      ? parseInt(form.reopenedIssues)        : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to create release'); return; }

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
        <Plus className="w-3.5 h-3.5" />
        New Release
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Release" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Version *" placeholder="v2.5.0" value={form.version} onChange={(e) => set('version', e.target.value)} required />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              options={[
                { value: 'PENDING', label: 'Pending' },
                { value: 'DEPLOYED', label: 'Deployed' },
                { value: 'ROLLED_BACK', label: 'Rolled Back' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
          </div>

          <TextEditor
            label="Description"
            value={form.description}
            onChange={(value) => set('description', value)}
            placeholder="Describe this release...&#10;&#10;You can use:&#10;• Bullet points for lists&#10;• **Bold text** for emphasis&#10;• `code` for technical terms"
          />

          <Input
            label="Deployment Date *"
            type="datetime-local"
            value={form.deploymentDate}
            onChange={(e) => set('deploymentDate', e.target.value)}
            required
          />

          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium text-gray-400 mb-3">Engineering Signals (optional — for risk scoring)</p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="PR Size (LOC)" placeholder="1200" type="number" value={form.prSize} onChange={(e) => set('prSize', e.target.value)} />
              <Input label="Review Duration (jam)" placeholder="24" type="number" value={form.reviewDurationHours} onChange={(e) => set('reviewDurationHours', e.target.value)} />
              <Input label="Failed Build Rate (0-1)" placeholder="0.12" type="number" step="0.01" value={form.failedBuildRate} onChange={(e) => set('failedBuildRate', e.target.value)} />
              <Input label="Test Coverage (%)" placeholder="72" type="number" value={form.testCoverage} onChange={(e) => set('testCoverage', e.target.value)} />
              <Input label="Deploys/Week" placeholder="5" type="number" value={form.deploymentsPerWeek} onChange={(e) => set('deploymentsPerWeek', e.target.value)} />
              <Input label="Reopened Issues" placeholder="3" type="number" value={form.reopenedIssues} onChange={(e) => set('reopenedIssues', e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              Create Release
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

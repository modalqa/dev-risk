'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import TextEditor from '@/components/ui/TextEditor';
import { Plus } from 'lucide-react';

interface Release { id: string; version: string; }

export default function AddRiskButton({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [releases, setReleases] = useState<Release[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'ENGINEERING',
    severity: 'MEDIUM',
    score: '50',
    releaseId: '',
  });

  useEffect(() => {
    if (open) {
      fetch('/api/releases?pageSize=50')
        .then((r) => r.json())
        .then((d) => setReleases(d.data ?? []));
    }
  }, [open]);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       form.title,
          description: form.description,
          category:    form.category,
          severity:    form.severity,
          score:       parseFloat(form.score),
          releaseId:   form.releaseId || null,
        }),
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

  const releaseOptions = [
    { value: '', label: '— No release —' },
    ...releases.map((r) => ({ value: r.id, label: r.version })),
  ];

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="w-3.5 h-3.5" />
        Add Risk
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Risk Item" size="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Title - Full Width */}
          <Input 
            label="Risk Title" 
            placeholder="Enter risk title..." 
            value={form.title} 
            onChange={(e) => set('title', e.target.value)} 
            required 
            className="w-full"
          />

          {/* Description - Full Width with Text Editor */}
          <TextEditor
            label="Risk Description"
            value={form.description}
            onChange={(value) => set('description', value)}
            placeholder="Describe the risk in detail... 

You can use:
• Bullet points for lists
• **Bold text** for emphasis
• `code` for technical terms
• Multiple lines for better structure"
            required
          />

          {/* Category and Severity - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Risk Category"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              options={[
                { value: 'ENGINEERING',     label: 'Engineering' },
                { value: 'SECURITY',        label: 'Security' },
                { value: 'PERFORMANCE',     label: 'Performance' },
                { value: 'USER_JOURNEY',    label: 'User Journey' },
                { value: 'RELEASE_PROCESS', label: 'Release Process' },
              ]}
            />
            <Select
              label="Severity Level"
              value={form.severity}
              onChange={(e) => set('severity', e.target.value)}
              options={[
                { value: 'LOW',      label: 'Low' },
                { value: 'MEDIUM',   label: 'Medium' },
                { value: 'HIGH',     label: 'High' },
                { value: 'CRITICAL', label: 'Critical' },
              ]}
            />
          </div>

          {/* Score and Release - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Risk Score <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Input 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={form.score} 
                  onChange={(e) => set('score', e.target.value)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  /100
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">0 = Low impact, 100 = Critical impact</p>
            </div>
            
            <Select 
              label="Linked Release (Optional)" 
              value={form.releaseId} 
              onChange={(e) => set('releaseId', e.target.value)} 
              options={releaseOptions} 
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)} 
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={loading} 
              className="flex-1"
            >
              {loading ? 'Adding...' : 'Add Risk'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

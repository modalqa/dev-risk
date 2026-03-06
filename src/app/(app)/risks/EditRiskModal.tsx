'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TextEditor from '@/components/ui/TextEditor';

interface Risk {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  score: number;
  status: string;
  releaseId: string | null;
}

interface EditRiskModalProps {
  open: boolean;
  onClose: () => void;
  risk: Risk;
  releases: Array<{ id: string; version: string }>;
}

const categories = [
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'PERFORMANCE', label: 'Performance' },
  { value: 'USER_JOURNEY', label: 'User Journey' },
  { value: 'RELEASE_PROCESS', label: 'Release Process' },
];

const severities = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const statuses = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'MITIGATED', label: 'Mitigated' },
  { value: 'CLOSED', label: 'Closed' },
];

export default function EditRiskModal({ open, onClose, risk, releases }: EditRiskModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: risk.title,
    description: risk.description,
    category: risk.category,
    severity: risk.severity,
    score: risk.score,
    status: risk.status,
    releaseId: risk.releaseId || '',
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/risks/${risk.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          releaseId: formData.releaseId || null,
          score: Number(formData.score),
        }),
      });

      if (response.ok) {
        router.refresh();
        onClose();
      } else {
        console.error('Failed to update risk');
      }
    } catch (error) {
      console.error('Error updating risk:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this risk?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/risks/${risk.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
        onClose();
      } else {
        console.error('Failed to delete risk');
      }
    } catch (error) {
      console.error('Error deleting risk:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Risk" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Title - Full Width */}
        <Input
          label="Risk Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter risk title"
          required
        />

        {/* Description - Full Width with Text Editor */}
        <TextEditor
          label="Risk Description"
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="Describe the risk in detail..."
          required
        />

        {/* Category and Severity - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Risk Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={categories}
          />
          <Select
            label="Severity Level"
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
            options={severities}
          />
        </div>

        {/* Score and Status - Side by Side */}
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
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                required
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                /100
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">0 = Low impact, 100 = Critical impact</p>
          </div>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={statuses}
          />
        </div>

        {/* Release - Full Width */}
        <Select
          label="Linked Release (Optional)"
          value={formData.releaseId}
          onChange={(e) => setFormData({ ...formData, releaseId: e.target.value })}
          options={[
            { value: '', label: 'No Release' },
            ...releases.map(r => ({ value: r.id, label: r.version }))
          ]}
        />

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={loading}
          >
            Delete
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
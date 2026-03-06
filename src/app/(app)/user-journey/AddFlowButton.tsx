'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

interface AddFlowButtonProps {
  onFlowAdded?: () => void;
}

export default function AddFlowButton({ onFlowAdded }: AddFlowButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    dropoffRate: '0.1',
    incidentCount: '0',
    stabilityScore: '0.7',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/user-journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          dropoffRate: parseFloat(formData.dropoffRate),
          incidentCount: parseInt(formData.incidentCount),
          stabilityScore: parseFloat(formData.stabilityScore),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create flow');
      }

      setShowModal(false);
      setFormData({
        name: '',
        dropoffRate: '0.1',
        incidentCount: '0',
        stabilityScore: '0.7',
      });
      
      // Reload page to see new flow
      window.location.reload();
      onFlowAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Flow
      </Button>

      <Modal 
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add User Journey Flow"
        size="md"
      >
        <div className="w-full">
          <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Flow Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Checkout Flow, Login, etc."
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Drop-off Rate"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={formData.dropoffRate}
              onChange={(e) => setFormData({ ...formData, dropoffRate: e.target.value })}
              placeholder="0.1"
            />
            <Input
              label="Stability Score"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={formData.stabilityScore}
              onChange={(e) => setFormData({ ...formData, stabilityScore: e.target.value })}
              placeholder="0.7"
            />
          </div>

          <Input
            label="Incident Count"
            type="number"
            min="0"
            value={formData.incidentCount}
            onChange={(e) => setFormData({ ...formData, incidentCount: e.target.value })}
            placeholder="0"
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-lg text-gray-300 hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={loading || !formData.name}
            >
              {loading ? 'Creating...' : 'Create Flow'}
            </Button>
          </div>
          </form>
        </div>
      </Modal>
    </>
  );
}

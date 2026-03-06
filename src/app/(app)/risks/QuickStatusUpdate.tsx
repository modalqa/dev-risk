'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertTriangle, Clock, XCircle, Shield } from 'lucide-react';

interface QuickStatusUpdateProps {
  riskId: string;
  currentStatus: string;
  className?: string;
}

const statusConfig = {
  OPEN: { label: 'Open', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  IN_PROGRESS: { label: 'In Progress', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  MITIGATED: { label: 'Mitigated', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  CLOSED: { label: 'Closed', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
};

const statusOrder = ['OPEN', 'IN_PROGRESS', 'MITIGATED', 'CLOSED'];

export default function QuickStatusUpdate({ riskId, currentStatus, className = '' }: QuickStatusUpdateProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateStatus = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/risks/${riskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = statusOrder.indexOf(currentStatus);
  const nextStatus = statusOrder[currentIndex + 1];
  
  if (!nextStatus) return null; // Already at final status

  const NextIcon = statusConfig[nextStatus as keyof typeof statusConfig].icon;
  const nextConfig = statusConfig[nextStatus as keyof typeof statusConfig];

  return (
    <button
      onClick={() => updateStatus(nextStatus)}
      disabled={loading}
      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${nextConfig.bg} ${nextConfig.color} hover:opacity-80 disabled:opacity-50 ${className}`}
      title={`Mark as ${nextConfig.label}`}
    >
      <NextIcon className="w-3 h-3" />
      {loading ? '...' : nextConfig.label}
    </button>
  );
}
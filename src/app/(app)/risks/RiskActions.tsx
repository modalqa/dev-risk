'use client';

import { useState } from 'react';
import { Edit2, MoreVertical } from 'lucide-react';
import EditRiskModal from './EditRiskModal';
import QuickStatusUpdate from './QuickStatusUpdate';

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

interface RiskActionsProps {
  risk: Risk;
  releases: Array<{ id: string; version: string }>;
}

export default function RiskActions({ risk, releases }: RiskActionsProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative flex items-center gap-2">
      {/* Quick Status Update */}
      <QuickStatusUpdate riskId={risk.id} currentStatus={risk.status} />

      {/* More Actions Menu */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 hover:bg-surface-2 rounded-lg transition-colors text-gray-400 hover:text-white"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-xl z-10 min-w-[120px]">
          <button
            onClick={() => {
              setIsEditModalOpen(true);
              setShowMenu(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-surface-2 transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            Edit Risk
          </button>
        </div>
      )}

      {showMenu && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(false)}
        />
      )}

      <EditRiskModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        risk={risk}
        releases={releases}
      />
    </div>
  );
}
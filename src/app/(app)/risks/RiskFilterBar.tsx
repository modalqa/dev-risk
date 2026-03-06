'use client';

import { useRouter, usePathname } from 'next/navigation';
import Select from '@/components/ui/Select';

const severityOptions = [
  { value: '', label: 'All Severity' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH',     label: 'High' },
  { value: 'MEDIUM',   label: 'Medium' },
  { value: 'LOW',      label: 'Low' },
];

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'ENGINEERING',     label: 'Engineering' },
  { value: 'USER_JOURNEY',    label: 'User Journey' },
  { value: 'RELEASE_PROCESS', label: 'Release Process' },
  { value: 'SECURITY',        label: 'Security' },
  { value: 'PERFORMANCE',     label: 'Performance' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'OPEN',        label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'MITIGATED',   label: 'Mitigated' },
  { value: 'CLOSED',      label: 'Closed' },
];

interface RiskFilterBarProps {
  currentFilters: Record<string, string>;
}

export default function RiskFilterBar({ currentFilters }: RiskFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams();
    const current = {
      severity: currentFilters.severity ?? '',
      category: currentFilters.category ?? '',
      status:   currentFilters.status   ?? '',
      [key]:    value,
    };
    Object.entries(current).forEach(([k, v]) => { if (v) params.set(k, v); });
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2 flex-1">
      <div className="w-36">
        <Select
          options={severityOptions}
          value={currentFilters.severity ?? ''}
          onChange={(e) => applyFilter('severity', e.target.value)}
        />
      </div>
      <div className="w-40">
        <Select
          options={categoryOptions}
          value={currentFilters.category ?? ''}
          onChange={(e) => applyFilter('category', e.target.value)}
        />
      </div>
      <div className="w-36">
        <Select
          options={statusOptions}
          value={currentFilters.status ?? ''}
          onChange={(e) => applyFilter('status', e.target.value)}
        />
      </div>
    </div>
  );
}

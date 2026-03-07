'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Select from '@/components/ui/Select';
import { Search, X } from 'lucide-react';

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
  releases: { id: string; version: string }[];
}

export default function RiskFilterBar({ currentFilters, releases }: RiskFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState(currentFilters.search ?? '');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const releaseOptions = [
    { value: '', label: 'All Releases' },
    ...releases.map((r) => ({ value: r.id, label: r.version })),
  ];

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams();
    const current = {
      severity:  currentFilters.severity  ?? '',
      category:  currentFilters.category  ?? '',
      status:    currentFilters.status    ?? '',
      releaseId: currentFilters.releaseId ?? '',
      search:    currentFilters.search    ?? '',
      [key]:     value,
    };
    Object.entries(current).forEach(([k, v]) => { if (v) params.set(k, v); });
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      applyFilter('search', value);
    }, 400);
  }

  function clearSearch() {
    setSearchValue('');
    applyFilter('search', '');
  }

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  return (
    <div className="flex flex-wrap gap-2 flex-1">
      {/* Search */}
      <div className="relative w-56">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search risks..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-8 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
        />
        {searchValue && (
          <button
            onClick={clearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
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
      <div className="w-40">
        <Select
          options={releaseOptions}
          value={currentFilters.releaseId ?? ''}
          onChange={(e) => applyFilter('releaseId', e.target.value)}
        />
      </div>
    </div>
  );
}

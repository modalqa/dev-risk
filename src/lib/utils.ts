import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getRiskIndexColor(index: number): string {
  if (index >= 75) return 'text-red-400';
  if (index >= 50) return 'text-orange-400';
  if (index >= 25) return 'text-yellow-400';
  return 'text-emerald-400';
}

export function getRiskIndexBg(index: number): string {
  if (index >= 75) return 'bg-red-500/10 border-red-500/20';
  if (index >= 50) return 'bg-orange-500/10 border-orange-500/20';
  if (index >= 25) return 'bg-yellow-500/10 border-yellow-500/20';
  return 'bg-emerald-500/10 border-emerald-500/20';
}

export function getSeverityBadgeClass(severity: string): string {
  switch (severity) {
    case 'CRITICAL': return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'HIGH':     return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    case 'MEDIUM':   return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    case 'LOW':      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    default:         return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'OPEN':        return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'IN_PROGRESS': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    case 'MITIGATED':   return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    case 'CLOSED':      return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    case 'DEPLOYED':    return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    case 'PENDING':     return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    case 'ROLLED_BACK': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    case 'CANCELLED':   return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    case 'ACTIVE':      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    case 'SUSPENDED':   return 'bg-red-500/20 text-red-400 border border-red-500/30';
    default:            return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  }
}

export function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    ENGINEERING:     'Engineering',
    USER_JOURNEY:    'User Journey',
    RELEASE_PROCESS: 'Release Process',
    SECURITY:        'Security',
    PERFORMANCE:     'Performance',
  };
  return map[category] ?? category;
}

export function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'OWNER':  return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
    case 'ADMIN':  return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    case 'VIEWER': return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    default:       return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  }
}

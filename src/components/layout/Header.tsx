'use client';

import { RefreshCw } from 'lucide-react';
import NotificationCenter from '@/components/NotificationCenter';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-surface/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h1 className="text-base font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {action && <div>{action}</div>}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-surface-2 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
        <NotificationCenter />
      </div>
    </header>
  );
}

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export default function Card({ children, className, glow, padding = 'md' }: CardProps) {
  const padMap = {
    none: '',
    sm:   'p-4',
    md:   'p-5',
    lg:   'p-6',
  };

  return (
    <div
      className={cn(
        'bg-surface rounded-xl border border-border',
        glow && 'shadow-glow',
        padMap[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

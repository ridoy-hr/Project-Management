import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'alert' | 'edit' | 'default';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    success: 'bg-success-bg text-success-text border-success-border',
    error: 'bg-error-bg text-error-text border-error-border',
    alert: 'bg-alert-bg text-alert-text border-alert-border',
    edit: 'bg-edit-bg text-edit-text border-edit-border',
    default: 'bg-black-100 text-black-500 border-black-200',
  };

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium whitespace-nowrap border", variants[variant], className)}>
      {children}
    </span>
  );
}

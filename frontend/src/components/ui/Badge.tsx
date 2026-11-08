import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  className = '',
  children,
  ...props
}) => {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-meta' : 'px-2.5 py-1 text-xs';
  
  const variantClass = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    accent: 'bg-accent-subtle text-accent-hover dark:text-accent border border-sky-200 dark:border-sky-900',
    success: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    danger: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

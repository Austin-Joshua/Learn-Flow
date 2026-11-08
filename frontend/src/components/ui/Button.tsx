import React from 'react';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, className = '', children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px] sm:min-h-0';
    
    const sizeClasses = size === 'sm' 
      ? 'px-3 py-1.5 text-xs rounded-md gap-1.5' 
      : 'px-4 py-2 text-xs rounded-xl gap-2';

    const variantClasses = {
      primary: 'bg-accent hover:bg-accent-hover text-white shadow-xs',
      secondary: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 shadow-xs',
      ghost: 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800',
      danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {loading && <Spinner size="sm" className="mr-1.5" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

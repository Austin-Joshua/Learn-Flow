import React from 'react';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, className = '', children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px] select-none';
    
    const sizeClasses = {
      sm: 'h-9 px-3.5 text-xs rounded-lg gap-1.5 min-h-[36px]',
      md: 'h-11 px-4 text-xs sm:text-sm rounded-lg gap-2 min-h-[44px]',
      lg: 'h-12 px-6 text-sm font-semibold rounded-xl gap-2.5 min-h-[48px]',
    }[size];

    const variantClasses = {
      primary: 'bg-[#0B2C6B] dark:bg-sky-600 hover:bg-[#123C8C] dark:hover:bg-sky-500 text-white shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
      gold: 'bg-[#D4AF37] hover:bg-[#b8972c] text-white shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
      secondary: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
      ghost: 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98]',
      danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
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

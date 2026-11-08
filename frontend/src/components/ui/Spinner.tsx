import React from 'react';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', ...props }) => {
  const sizeClass = {
    sm: 'w-3.5 h-3.5 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-3',
  }[size];

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`${sizeClass} border-slate-300 dark:border-slate-700 border-t-accent rounded-full animate-spin ${className}`}
      {...props}
    />
  );
};

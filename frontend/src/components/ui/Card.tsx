import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'raised' | 'dashed';
  hoverLift?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', hoverLift = false, className = '', children, ...props }, ref) => {
    const variantClass = {
      default: 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs',
      raised: 'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md',
      dashed: 'bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 shadow-xs',
    }[variant];

    const liftClass = hoverLift
      ? 'transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[#D4AF37] cursor-pointer'
      : 'transition-colors duration-200';

    return (
      <div ref={ref} className={`${variantClass} ${liftClass} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

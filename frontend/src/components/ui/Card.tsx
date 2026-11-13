import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'raised' | 'dashed';
  hoverLift?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', hoverLift = false, className = '', children, ...props }, ref) => {
    const variantClass = {
      default: 'skeuo-card bg-white dark:bg-[#071914] rounded-2xl border border-slate-200/90 dark:border-[#E4F455]/22 shadow-[0_1px_2px_rgba(4,16,12,0.04),0_6px_16px_rgba(22,62,68,0.06),inset_0_1px_0_rgba(255,255,255,0.95)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.5),0_8px_20px_rgba(4,16,12,0.6),inset_0_1px_0_rgba(228,244,85,0.08)]',
      raised: 'skeuo-card bg-white dark:bg-[#092019] rounded-2xl border border-slate-200 dark:border-[#E4F455]/28 shadow-[0_2px_4px_rgba(4,16,12,0.05),0_12px_28px_rgba(22,62,68,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.6),0_14px_32px_rgba(4,16,12,0.7),inset_0_1px_0_rgba(228,244,85,0.12)]',
      dashed: 'bg-white dark:bg-[#071914] rounded-2xl border border-dashed border-slate-300 dark:border-[#E4F455]/25 shadow-xs',
    }[variant];

    const liftClass = hoverLift
      ? 'card-uplift cursor-pointer hover:border-[#163E44]/40 dark:hover:border-[#E4F455]/60'
      : 'transition-colors duration-200';

    return (
      <div ref={ref} className={`${variantClass} ${liftClass} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

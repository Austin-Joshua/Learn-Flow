import React from 'react';

export interface AdaptiveGridProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Density variant:
   * - 'normal': 1 col mobile, 2 col tablet, 3 col desktop, 4 col wide
   * - 'compact': 1 col mobile, 2 col tablet, 4 col desktop
   * - 'split': 1 col mobile, 2 col tablet/desktop (two-pane)
   */
  variant?: 'normal' | 'compact' | 'split';
}

export const AdaptiveGrid: React.FC<AdaptiveGridProps> = ({
  children,
  className = '',
  variant = 'normal',
}) => {
  const gridClasses =
    variant === 'compact'
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'
      : variant === 'split'
      ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6';

  return <div className={`${gridClasses} ${className}`}>{children}</div>;
};


import React from 'react';

export interface StatTileProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  subtext?: string;
  className?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  icon,
  trend,
  subtext,
  className = '',
}) => {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-5 shadow-xs flex items-center justify-between ${className}`}>
      <div className="min-w-0 pr-2">
        <p className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">{label}</p>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5 sm:mt-1 tracking-tight">{value}</h3>
        {trend && <p className="text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1 truncate">{trend}</p>}
        {subtext && !trend && <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 sm:mt-1 truncate">{subtext}</p>}
      </div>
      {icon && (
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-accent-subtle text-accent flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}
    </div>
  );
};

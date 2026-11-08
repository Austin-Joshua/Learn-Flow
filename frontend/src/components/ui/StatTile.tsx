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
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex items-center justify-between ${className}`}>
      <div>
        <p className="text-meta font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</h3>
        {trend && <p className="text-meta font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{trend}</p>}
        {subtext && !trend && <p className="text-meta text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>}
      </div>
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}
    </div>
  );
};

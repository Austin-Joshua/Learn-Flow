import React from 'react';

export interface ImsReportTableProps {
  title: string;
  headers: string[];
  rows: Array<Record<string, any>>;
  emptyLabel?: string;
  className?: string;
  actions?: React.ReactNode;
}

export const ImsReportTable: React.FC<ImsReportTableProps> = ({
  title,
  headers,
  rows,
  emptyLabel = 'No records available in current view',
  className = '',
  actions,
}) => {
  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-xs overflow-hidden ${className}`}>
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h3>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      <div className="overflow-x-auto">
        <table className="ims-report-table">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="text-center py-8 text-xs text-slate-500 dark:text-slate-400"
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  {headers.map((header) => (
                    <td key={header} className="text-xs font-medium">
                      {row[header] ?? row[header.toLowerCase().replace(/\s+/g, '_')] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


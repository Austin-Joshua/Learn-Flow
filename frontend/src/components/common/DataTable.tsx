import React from 'react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  /**
   * Visibility priority:
   * - 'always': rendered on mobile, tablet, and desktop
   * - 'tablet-up': rendered on tablet and desktop (hidden on mobile)
   * - 'desktop-only': rendered only on desktop (>= 1024px)
   */
  priority?: 'always' | 'tablet-up' | 'desktop-only';
  align?: 'left' | 'center' | 'right';
  className?: string;
  isPrimary?: boolean; // Mobile card header
  isStatus?: boolean;  // Mobile card status badge
  isAction?: boolean;  // Mobile card trailing action
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
  mobileCardRender?: (item: T) => React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No records found.',
  emptyIcon,
  className = '',
  mobileCardRender,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={`p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 ${className}`}>
        {emptyIcon && <div className="mb-2 text-slate-400 flex justify-center">{emptyIcon}</div>}
        <p className="text-xs text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  // Mobile column role mapping for fallback card presentation
  const primaryCol = columns.find((c) => c.isPrimary) || columns[0];
  const statusCol = columns.find((c) => c.isStatus);
  const actionCol = columns.find((c) => c.isAction);
  const detailCols = columns.filter((c) => c !== primaryCol && c !== statusCol && c !== actionCol);

  return (
    <div className={`w-full ${className}`}>
      {/* ========================================================================= */}
      {/* 1. TABLET & DESKTOP: Dense HTML Table with Sticky Header (Fit to screen) */}
      {/* ========================================================================= */}
      <div className="hidden md:block w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full table-fixed text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 select-none">
            <tr>
              {columns.map((col) => {
                const alignClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';

                const priorityClass =
                  col.priority === 'desktop-only'
                    ? 'hidden lg:table-cell'
                    : col.priority === 'tablet-up'
                    ? 'hidden md:table-cell'
                    : '';

                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`py-3 px-4 text-label font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold ${alignClass} ${priorityClass} ${col.className || ''}`}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
              >
                {columns.map((col) => {
                  const alignClass =
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left';

                  const priorityClass =
                    col.priority === 'desktop-only'
                      ? 'hidden lg:table-cell'
                      : col.priority === 'tablet-up'
                      ? 'hidden md:table-cell'
                      : '';

                  return (
                    <td
                      key={col.key}
                      className={`py-3 px-4 ${alignClass} ${priorityClass} ${col.className || ''}`}
                    >
                      {col.render(item)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE: Compact Card List (< 768px)                                   */}
      {/* ========================================================================= */}
      <div className="md:hidden space-y-3">
        {data.map((item) => {
          if (mobileCardRender) {
            return <div key={keyExtractor(item)}>{mobileCardRender(item)}</div>;
          }

          return (
            <div
              key={keyExtractor(item)}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {primaryCol && <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{primaryCol.render(item)}</div>}
                </div>
                {statusCol && <div className="shrink-0">{statusCol.render(item)}</div>}
              </div>

              {detailCols.length > 0 && (
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  {detailCols.map((col) => (
                    <div key={col.key} className="space-y-0.5">
                      <span className="text-meta font-mono uppercase text-slate-400 block">{col.header}</span>
                      <div className="text-slate-700 dark:text-slate-300 font-medium">{col.render(item)}</div>
                    </div>
                  ))}
                </div>
              )}

              {actionCol && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex justify-end">
                  {actionCol.render(item)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


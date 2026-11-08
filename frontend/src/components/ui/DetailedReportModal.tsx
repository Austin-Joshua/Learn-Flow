import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, ArrowRight, Download, Printer } from 'lucide-react';
import { modalVariants } from '../../utils/animationVariants';

export interface DetailedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  trend?: number[];
  data?: Array<Record<string, any>>;
  description?: string;
  onDownloadReport?: () => void;
}

export const DetailedReportModal: React.FC<DetailedReportModalProps> = ({
  isOpen,
  onClose,
  title,
  value,
  label,
  icon,
  trend = [85, 82, 88, 84, 92],
  data = [],
  description,
  onDownloadReport,
}) => {
  if (!isOpen) return null;

  const resolvedDescription =
    description ||
    `Based on current ${(title || '').toLowerCase()} progress and previous assessments, we observe steady conceptual mastery across learning tracks. Maintain current focus for upcoming milestones.`;

  const handleDownloadCsv = () => {
    if (onDownloadReport) {
      onDownloadReport();
      return;
    }
    const reportTitle = `${title || 'Report'} Analytics`;
    const rows = [
      ['Metric', 'Observed Value', 'Category'],
      [title, String(value), label],
      [],
      ['Cycle Trend', 'Efficiency Score'],
      ...trend.map((val, idx) => [`Cycle ${idx + 1}`, `${val}%`]),
    ];
    if (data.length > 0) {
      rows.push([]);
      rows.push(['Supporting Data Snapshot']);
      const headers = Object.keys(data[0]);
      rows.push(headers);
      data.forEach((row) => {
        rows.push(headers.map((h) => String(row[h] ?? '')));
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '-')}-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-2xl bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#0B2C6B] text-[#D4AF37] flex items-center justify-center text-xl shadow-xs">
                {icon || <Info className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {title} Analysis
                </h2>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                  Detailed Insight Report
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Top Grid: Status & Trend */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Current Telemetry
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-[#0B2C6B] dark:text-sky-300 tracking-tight my-2">
                    {value}
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {label}
                </div>
              </div>

              {/* Progress Trend Progression Bars */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  5-Cycle Progression Trend
                </h4>
                <div className="space-y-2 pt-1">
                  {trend.map((val, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="text-[11px] font-bold w-12 text-slate-500 shrink-0">
                        Cycle {i + 1}
                      </div>
                      <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${val}%` }}
                          transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                          className="h-full bg-[#D4AF37]"
                        />
                      </div>
                      <div className="text-[11px] font-black text-slate-700 dark:text-slate-300 w-8 text-right shrink-0">
                        {val}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Smart AI Recommendation Card */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
              <h4 className="flex items-center gap-2 text-xs font-black text-[#0B2C6B] dark:text-[#D4AF37] uppercase tracking-wide">
                <Info className="w-4 h-4" /> Smart Copilot Recommendation
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {resolvedDescription}
              </p>
            </div>

            {/* Supporting Data Table Snapshot if data provided */}
            {data.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
                  Supporting Data Snapshot
                </div>
                <div className="overflow-x-auto max-h-40">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        {Object.keys(data[0]).map((key) => (
                          <th key={key} className="px-3 py-2">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          {Object.keys(data[0]).map((key) => (
                            <td key={key} className="px-3 py-1.5 text-slate-700 dark:text-slate-300">
                              {row[key] ?? '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Buttons with Slick Hover & Tap */}
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0B2C6B] hover:bg-[#123C8C] shadow-md shadow-blue-900/20 transition-all hover:scale-105 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" /> Download Report <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Printer, Copy, Check } from 'lucide-react';

export interface ExportButtonsProps {
  filename?: string;
  data?: Array<Record<string, any>>;
  headers?: string[];
  className?: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  filename = 'ExportData',
  data = [],
  headers = [],
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const getTableHeaders = () => {
    if (headers.length > 0) return headers;
    if (data.length > 0) return Object.keys(data[0]);
    return [];
  };

  const handleExportCsv = () => {
    if (!data || data.length === 0) return;
    const tableHeaders = getTableHeaders();
    const rows = [
      tableHeaders.join(','),
      ...data.map((row) =>
        tableHeaders
          .map((h) => {
            const val = row[h] ?? '';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename.toLowerCase().replace(/\s+/g, '_')}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    if (!data || data.length === 0) return;
    const tableHeaders = getTableHeaders();
    const tsv = [
      tableHeaders.join('\t'),
      ...data.map((row) => tableHeaders.map((h) => String(row[h] ?? '')).join('\t')),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 ${className}`}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={handleExportCsv}
        title="Export CSV / Excel"
        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-[#0082fb] dark:hover:text-[#3aa0ff] shadow-xs flex items-center gap-1.5 transition-colors"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
        <span className="hidden sm:inline">CSV</span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={handleCopy}
        title="Copy Table Data"
        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-[#0082fb] dark:hover:text-[#3aa0ff] shadow-xs flex items-center gap-1.5 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={handlePrint}
        title="Print Document"
        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-[#0082fb] dark:hover:text-[#3aa0ff] shadow-xs flex items-center gap-1.5 transition-colors"
      >
        <Printer className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Print</span>
      </motion.button>
    </div>
  );
};


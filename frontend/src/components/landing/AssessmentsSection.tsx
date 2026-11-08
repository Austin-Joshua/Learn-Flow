import React, { useState } from 'react';
import { Clock, ShieldCheck } from 'lucide-react';

export const AssessmentsSection: React.FC = () => {
  const [arenaSelectedAnswer, setArenaSelectedAnswer] = useState<number | null>(3);

  return (
    <section id="assessments" className="py-20 bg-slate-50 dark:bg-[#06080c] border-y border-slate-200 dark:border-white/10 text-slate-900 dark:text-[#f2f5f9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0082fb]/10 border border-[#0082fb]/30 text-[#0082fb] dark:text-[#3aa0ff] text-xs font-mono font-medium mb-3">
            <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Assessment Architecture</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-[#f2f5f9]">
            Secure Timed Assessment Arena
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-[#8a94a6]">
            Server-authoritative timestamp bounds, attempt limits, and audit logs.
          </p>
        </div>

        {/* Interactive Exam Simulation Card */}
        <div className="max-w-4xl mx-auto bg-white dark:bg-[#0b0f16] rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
          {/* Arena Top Toolbar */}
          <div className="px-6 py-4 bg-slate-100 dark:bg-[#06080c] border-b border-slate-200 dark:border-white/10 text-slate-900 dark:text-white flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-meta font-mono text-[#0082fb] dark:text-[#3aa0ff] uppercase tracking-wider">Exam Environment &bull; Midterm</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">PostgreSQL Concurrency &amp; Storage Architecture</h3>
            </div>

            <div className="flex items-center space-x-4 font-mono text-xs">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded bg-white dark:bg-[#020308] border border-slate-200 dark:border-white/10 text-amber-600 dark:text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span>24:18 remaining</span>
              </div>
              <span className="text-label text-slate-500 dark:text-[#8a94a6]">Question 3 of 10</span>
            </div>
          </div>

          {/* Question Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-500 dark:text-[#8a94a6]">QUESTION 3 (SINGLE CHOICE &bull; 2.0 PTS)</span>
              <h4 className="text-base font-bold text-slate-900 dark:text-[#f2f5f9] leading-snug">
                Which scan type in PostgreSQL query execution plans confirms that all requested columns were resolved directly from the index tree without reading the table heap?
              </h4>
            </div>

            {/* Code Snippet Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#020308] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 font-mono text-xs">
              <div className="text-slate-500 dark:text-[#8a94a6] mb-1">-- Execution Plan Inspection</div>
              <code>EXPLAIN (ANALYZE, BUFFERS) SELECT user_id, tenant_id FROM users WHERE tenant_id = 42;</code>
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-2.5">
              {[
                { id: 1, text: 'Sequential Scan (Seq Scan)', correct: false },
                { id: 2, text: 'Bitmap Heap Scan', correct: false },
                { id: 3, text: 'Index Only Scan (Heap Fetches: 0)', correct: true },
                { id: 4, text: 'TID Scan', correct: false },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setArenaSelectedAnswer(opt.id)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                    arenaSelectedAnswer === opt.id
                      ? opt.correct
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-200'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 dark:bg-[#06080c] dark:border-white/10 dark:text-[#f2f5f9] dark:hover:border-white/20'
                  }`}
                >
                  <span>{opt.text}</span>
                  {arenaSelectedAnswer === opt.id && (
                    <span className={`text-meta font-mono font-semibold px-2 py-0.5 rounded ${
                      opt.correct ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                    }`}>
                      {opt.correct ? 'CORRECT ANSWER' : 'INCORRECT'}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Integrity Note */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#06080c] border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-[#8a94a6] flex items-start space-x-3">
              <ShieldCheck className="w-4 h-4 text-[#0082fb] dark:text-[#3aa0ff] shrink-0 mt-0.5" />
              <p>
                <strong className="text-slate-900 dark:text-white">Academic Integrity Statement:</strong> Learnflow enforces time boundaries on the backend database transaction. Timed assessments with attempt limits and audit logs ensure verifiable evaluation without invasive client software.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

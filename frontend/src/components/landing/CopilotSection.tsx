import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Check, ArrowRight } from 'lucide-react';

export const CopilotSection: React.FC = () => {
  return (
    <section id="copilot" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-mono font-medium">
            <Bot className="w-3.5 h-3.5 text-sky-500" />
            <span>Role-Scoped AI Assistant</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Learnflow AI Study Copilot
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            An intelligent tutoring assistant grounded strictly in your enrolled curriculum. Powered by retrieval-augmented generation (RAG) with multi-instance Redis caching and prompt-injection defense.
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-start space-x-2.5 text-slate-600 dark:text-slate-300">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Enrolled-course boundary: Never leaks other departments or answer keys.</span>
            </div>
            <div className="flex items-start space-x-2.5 text-slate-600 dark:text-slate-300">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Distributed Redis semantic caching for sub-millisecond answer retrieval.</span>
            </div>
            <div className="flex items-start space-x-2.5 text-slate-600 dark:text-slate-300">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Hands-free voice recognition with automatic Web Speech fallback.</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xs"
            >
              <span>Try Study Copilot in Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Interactive Chat Mockup Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 text-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Study Copilot</h4>
                <span className="text-meta font-mono text-emerald-400">Context: Full-Stack System Design &bull; Mod 1</span>
              </div>
            </div>
            <span className="text-meta font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              Redis Cached
            </span>
          </div>

          {/* Chat Transcript */}
          <div className="space-y-3 text-xs">
            <div className="bg-slate-800/80 rounded-xl p-3.5 text-slate-200 border border-slate-700/60">
              <span className="text-meta font-mono text-slate-400 block mb-1">Ada Lovelace (Student):</span>
              Why does the composite index (tenant_id, created_at) fail to optimize a query filtering only on created_at?
            </div>

            <div className="bg-sky-950/40 rounded-xl p-3.5 text-sky-200 border border-sky-800/60 space-y-2">
              <span className="text-meta font-mono text-sky-400 block">Study Copilot:</span>
              <p className="leading-relaxed">
                Under the <strong>B-Tree leftmost prefix rule</strong>, the composite index is sorted primarily by <code>tenant_id</code> and secondarily by <code>created_at</code>. A query filtering only on <code>created_at</code> lacks the root partitioning key and cannot perform a binary tree seek.
              </p>
              <div className="pt-1 text-label font-mono text-sky-400">
                Ref: Lesson 1.1 &bull; PostgreSQL B-Tree Index Optimization &sect;2.1
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

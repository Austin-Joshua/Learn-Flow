import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Bot, Check, ArrowRight, Sparkles, MessageSquare } from 'lucide-react';

export const CopilotSection: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const PRESET_QUERIES = [
    {
      q: 'Why does composite index (tenant_id, created_at) fail when filtering only created_at?',
      a: 'Under the B-Tree leftmost prefix rule, the composite index is sorted primarily by tenant_id and secondarily by created_at. A query filtering only on created_at lacks the root partitioning key and cannot perform a binary tree seek.',
      ref: 'Lesson 1.1 • PostgreSQL B-Tree Index Optimization §2.1',
    },
    {
      q: 'How does the assignment quarantine pipeline handle student file uploads?',
      a: 'Uploaded files are placed in an isolated quarantine storage bucket with strict MIME type and magic byte verification before promotion to accessible storage.',
      ref: 'Architecture Guide • File Storage Pipeline §4.2',
    },
    {
      q: 'Explain the difference between optimistic concurrency and row-level locking.',
      a: 'Row-level locking (SELECT FOR UPDATE) blocks concurrent transactions immediately. Optimistic concurrency allows parallel reads and verifies version tags at commit, rolling back on conflict.',
      ref: 'Lesson 3.2 • Transaction Isolation & Concurrency Control §1.4',
    },
  ];

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [streamedText, setStreamedText] = useState(PRESET_QUERIES[0].a);
  const [isTyping, setIsTyping] = useState(false);

  const handleQueryClick = (idx: number) => {
    setSelectedIdx(idx);
    setIsTyping(true);
    setStreamedText('');
    const fullText = PRESET_QUERIES[idx].a;
    let charIdx = 0;
    const interval = setInterval(() => {
      charIdx += 4;
      if (charIdx >= fullText.length) {
        setStreamedText(fullText);
        setIsTyping(false);
        clearInterval(interval);
      } else {
        setStreamedText(fullText.slice(0, charIdx));
      }
    }, 16);
  };

  return (
    <section id="copilot" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-[#f2f5f9]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#163E44]/10 dark:bg-[#E4F455]/15 border border-[#163E44]/20 dark:border-[#E4F455]/30 text-[#163E44] dark:text-[#E4F455] text-xs font-mono font-medium">
            <Bot className="w-3.5 h-3.5 text-[#163E44] dark:text-[#E4F455]" />
            <span>Role-Scoped AI Assistant</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-[#f2f5f9]">
            Learnflow AI Study Copilot
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-[#a0bdb6] leading-relaxed font-normal">
            An intelligent tutoring assistant grounded strictly in your enrolled curriculum. Powered by retrieval-augmented generation (RAG) with multi-instance Redis caching and prompt-injection defense.
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-start space-x-2.5 text-slate-600 dark:text-[#a0bdb6]">
              <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>Enrolled-course boundary: Never leaks other departments or answer keys.</span>
            </div>
            <div className="flex items-start space-x-2.5 text-slate-600 dark:text-[#a0bdb6]">
              <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>Distributed Redis semantic caching for sub-millisecond answer retrieval.</span>
            </div>
            <div className="flex items-start space-x-2.5 text-slate-600 dark:text-[#a0bdb6]">
              <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>Interactive prompt simulation: Click any query to stream live answer.</span>
            </div>
          </div>

          {/* Interactive Question Prompts */}
          <div className="space-y-2 pt-1">
            <span className="text-label font-mono text-slate-500 dark:text-[#a0bdb6] uppercase">Click Sample Query:</span>
            <div className="flex flex-col gap-2">
              {PRESET_QUERIES.map((p, idx) => (
                <button
                  key={p.q}
                  type="button"
                  onClick={() => handleQueryClick(idx)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer flex items-center space-x-2 ${
                    selectedIdx === idx
                      ? 'bg-[#163E44]/20 border-[#163E44] dark:bg-[#163E44]/40 dark:border-[#E4F455] text-slate-900 dark:text-[#E4F455] font-medium shadow-xs'
                      : 'bg-slate-50 dark:bg-[#04100C] border border-slate-200 dark:border-[#E4F455]/15 text-slate-700 dark:text-[#a0bdb6] hover:text-slate-900 dark:hover:text-[#E4F455] hover:border-slate-300 dark:hover:border-[#E4F455]/40'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#163E44] dark:text-[#E4F455] shrink-0" />
                  <span className="truncate">{p.q}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Link
              to={isAuthenticated ? '/my-learning' : '/login'}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-[#163E44] hover:bg-[#1f525a] dark:bg-[#E4F455] dark:hover:bg-[#d6e643] text-white dark:text-[#04100C] text-xs font-semibold transition-all shadow-xs"
            >
              <span>Try Study Copilot in Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Interactive Chat Mockup Card */}
        <div className="card-uplift bg-white dark:bg-[#071914] rounded-2xl border border-slate-200 dark:border-[#E4F455]/25 shadow-2xl p-6 text-slate-900 dark:text-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#E4F455]/15">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-[#163E44]/20 text-[#163E44] dark:bg-[#E4F455]/20 dark:text-[#E4F455] flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Study Copilot</h4>
                <span className="text-meta font-mono text-emerald-600 dark:text-emerald-400">Context: Full-Stack System Design &bull; Mod 1</span>
              </div>
            </div>
            <span className="text-meta font-mono text-slate-500 dark:text-[#a0bdb6] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#04100C] border border-slate-200 dark:border-[#E4F455]/15">
              Redis Cached &bull; Sample preview
            </span>
          </div>

          {/* Chat Transcript */}
          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 dark:bg-[#04100C] rounded-xl p-3.5 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#E4F455]/15">
              <span className="text-meta font-mono text-slate-500 dark:text-[#a0bdb6] block mb-1">Ada Lovelace (Student):</span>
              {PRESET_QUERIES[selectedIdx].q}
            </div>

            <div className="bg-[#163E44]/15 dark:bg-[#163E44]/35 rounded-xl p-3.5 text-slate-900 dark:text-[#f0f7f4] border border-[#163E44]/30 dark:border-[#E4F455]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-meta font-mono text-[#163E44] dark:text-[#E4F455] block flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Study Copilot (Gemini 2.0 Flash):
                </span>
                {isTyping && (
                  <span className="text-meta font-mono text-[#163E44] dark:text-[#E4F455] animate-pulse">Streaming tokens...</span>
                )}
              </div>
              <p className="leading-relaxed font-normal">
                {streamedText}
                {isTyping && <span className="inline-block w-1.5 h-3.5 bg-[#163E44] dark:bg-[#E4F455] ml-1 animate-pulse" />}
              </p>
              <div className="pt-1 text-label font-mono text-[#163E44] dark:text-[#E4F455]">
                Ref: {PRESET_QUERIES[selectedIdx].ref}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

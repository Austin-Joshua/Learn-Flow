import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Cpu,
  Lock,
  Sparkles,
  Layers,
} from 'lucide-react';

interface HeroSectionProps {
  onExploreClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick }) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Aurora Drift Ambient Glows */}
      <div className="pointer-events-none absolute -top-1/4 -left-1/4 h-[70vh] w-[70vh] rounded-full blur-[130px] bg-[#0082fb]/15 animate-aurora" />
      <div className="pointer-events-none absolute -right-1/4 -bottom-1/4 h-[60vh] w-[60vh] rounded-full blur-[140px] bg-[#8457f5]/15 animate-aurora-slow" />

      {/* Hero Scan Beam */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#3aa0ff]/80 to-transparent animate-hero-scan" />
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto space-y-6">
        {/* Bracket Pulse Ecosystem Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#06080c] border border-white/10 text-xs font-mono text-[#f2f5f9]"
        >
          <span className="text-[#0082fb] font-bold animate-bracket-pulse">[</span>
          <Sparkles className="w-3.5 h-3.5 text-[#3aa0ff]" />
          <span className="tracking-wide">AI-Powered EdTech Product · ProEduvate Ecosystem</span>
          <span className="text-[#0082fb] font-bold animate-bracket-pulse">]</span>
        </motion.div>

        {/* Main Precision Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#f2f5f9] leading-[1.1] sm:leading-[1.1]"
        >
          Building the future of{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0082fb] via-[#3aa0ff] to-[#7cc2ff]">
            learning &amp; verified
          </span>{' '}
          engineering technology.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="text-base sm:text-lg text-[#8a94a6] max-w-2xl mx-auto leading-relaxed font-normal"
        >
          ProEduvate builds and ships AI-native software. Learnflow is our flagship learning platform—dissolving sequential curricula, server-side anti-cheat assessments, role-scoped AI tutoring, and cryptographic HMAC-SHA256 diplomas into one system of intelligence.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <a
            href="#courses"
            onClick={onExploreClick}
            className="w-full sm:w-auto h-12 px-7 rounded-lg bg-[#0082fb] hover:bg-[#155dfc] text-white text-xs font-semibold transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer glow-blue"
          >
            <span>Explore Curricula</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <Link
            to="/login"
            className="w-full sm:w-auto h-12 px-7 rounded-lg bg-[#0b0f16] hover:bg-[#101828] text-[#f2f5f9] border border-white/10 hover:border-white/20 text-xs font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Terminal className="w-4 h-4 text-[#3aa0ff]" />
            <span>Launch Student Portal</span>
          </Link>

          <a
            href="#proeduvate-hub"
            className="w-full sm:w-auto h-12 px-6 rounded-lg bg-transparent hover:bg-white/5 text-[#8a94a6] hover:text-[#f2f5f9] text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
          >
            <Layers className="w-4 h-4 text-[#8457f5]" />
            <span>ProEduvate Hub</span>
          </a>
        </motion.div>

        {/* Invariant Signals */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-meta font-mono text-[#8a94a6]">
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sequential Module Invariants</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Server-Authoritative Anti-Cheat</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>HMAC-SHA256 Signed Diplomas</span>
          </span>
        </div>

        {/* Interactive Live Showcase Window */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          className="mt-10 rounded-2xl bg-[#06080c] border border-white/10 overflow-hidden text-left shadow-2xl"
        >
          {/* Mac-style Window Titlebar */}
          <div className="bg-[#0b0f16] border-b border-white/10 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-label font-mono text-[#8a94a6]">
                learnflow://arena/session-live#verified
              </span>
            </div>
            <div className="flex items-center space-x-2 text-label font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>PROCTORED LIVE INSTANCE</span>
            </div>
          </div>

          {/* Interactive Screen Preview */}
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Box: Active Assessment Arena */}
            <div className="rounded-xl bg-[#020308] border border-white/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-label font-mono uppercase tracking-wider text-[#3aa0ff] bg-[#0082fb]/10 px-2 py-0.5 rounded border border-[#0082fb]/20">
                  Arena Track
                </span>
                <span className="text-label font-mono text-amber-400">Time Left: 24:18</span>
              </div>
              <h3 className="text-sm font-bold text-[#f2f5f9] leading-snug">
                Distributed Locking &amp; Advisory Lock Verification
              </h3>
              <p className="text-xs text-[#8a94a6] leading-relaxed">
                Execute atomic PostgreSQL row operations without deadlocks under 500 concurrent workers.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-label font-mono text-[#8a94a6]">
                <span>Anti-Cheat Integrity: 100%</span>
                <span className="text-emerald-400">Server Locked</span>
              </div>
            </div>

            {/* Middle Box: Mountain Journey Progress */}
            <div className="rounded-xl bg-[#020308] border border-white/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-label font-mono uppercase tracking-wider text-[#8457f5] bg-[#8457f5]/10 px-2 py-0.5 rounded border border-[#8457f5]/20">
                  Mountain Trail
                </span>
                <span className="text-label font-mono text-emerald-400">Module 4 of 6</span>
              </div>
              <h3 className="text-sm font-bold text-[#f2f5f9] leading-snug">
                Base Camp to Diploma Summit
              </h3>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#0082fb] to-[#3aa0ff] h-full w-[68%]" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-label font-mono text-[#8a94a6]">
                <span>Next: WAL Recovery</span>
                <span className="text-[#3aa0ff]">68% Mastered</span>
              </div>
            </div>

            {/* Right Box: AI Study Copilot */}
            <div className="rounded-xl bg-[#020308] border border-white/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-label font-mono uppercase tracking-wider text-[#7cc2ff] bg-[#7cc2ff]/10 px-2 py-0.5 rounded border border-[#7cc2ff]/20">
                  AI Study Copilot
                </span>
                <Cpu className="w-3.5 h-3.5 text-[#3aa0ff]" />
              </div>
              <h3 className="text-sm font-bold text-[#f2f5f9] leading-snug">
                Role-Scoped RAG Assistant
              </h3>
              <p className="text-xs text-[#8a94a6] leading-relaxed">
                Contextual hints without giving away graded solutions. Voice transcription enabled.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-label font-mono text-[#8a94a6]">
                <span>Model: Gemini 2.0 Flash</span>
                <span className="text-emerald-400">Context Scoped</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

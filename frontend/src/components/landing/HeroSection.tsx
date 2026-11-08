import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, Check } from 'lucide-react';

interface HeroSectionProps {
  onExploreClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick }) => {
  return (
    <section className="relative pt-16 pb-16 md:pt-24 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium"
        >
          <GraduationCap className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Learnflow LMS &bull; Department of Computer Science &amp; Engineering</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight sm:leading-none"
        >
          Verifiable Computer Science Education.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal"
        >
          Master distributed systems, concurrency protocols, and modern web architectures. Featuring server-side sequential module unlocking, tamper-proof timed assessments, and cryptographically verified diplomas.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <a
            href="#courses"
            onClick={onExploreClick}
            className="w-full sm:w-auto h-11 px-6 rounded-md bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
          >
            <span>Explore Curricula</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <Link
            to="/login"
            className="w-full sm:w-auto h-11 px-6 rounded-md bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <span>Access Student Portal</span>
          </Link>
        </motion.div>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-label font-mono text-slate-500 dark:text-slate-400">
          <span className="flex items-center space-x-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sequential Module Invariant</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>HMAC-SHA256 Signed Diplomas</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>Zero-Tracker Proctoring Integrity</span>
          </span>
        </div>
      </div>
    </section>
  );
};

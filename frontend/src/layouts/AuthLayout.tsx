import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useLocation, Outlet, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { AnimatedWaveBackground } from '../components/auth/AnimatedWaveBackground';
import { GraduationCap, Sun, Moon, ShieldCheck, Activity } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const isLogin = location.pathname === '/login';

  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    let timeoutId: any;
    const checkBackend = async () => {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 6000);
      try {
        const res = await fetch('/api/v1/health', {
          signal: controller.signal,
        });
        if (res.ok) setBackendStatus('online');
        else setBackendStatus('offline');
      } catch (e) {
        setBackendStatus('offline');
      } finally {
        clearTimeout(timeoutId);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 12000);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, []);

  const ease = [0.4, 0, 0.2, 1] as const;

  const panelVariants: Variants = {
    login: { x: 0, transition: { duration: 0.45, ease } },
    signup: { x: '100%', transition: { duration: 0.45, ease } },
  };

  const formPanelVariants: Variants = {
    login: { x: 0, transition: { duration: 0.45, ease } },
    signup: { x: '-100%', transition: { duration: 0.45, ease } },
  };

  const textVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.3 } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.15 } },
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center relative overflow-hidden transition-colors duration-300 font-sans">
      {/* Top Controls: Dark/Light Mode + Backend Health Badge */}
      <div className="fixed top-5 right-6 z-50 flex items-center space-x-3">
        {/* Backend Status Pill */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium backdrop-blur-md border ${
            backendStatus === 'online'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : backendStatus === 'checking'
              ? 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              backendStatus === 'online'
                ? 'bg-emerald-500'
                : backendStatus === 'checking'
                ? 'bg-sky-500 animate-ping'
                : 'bg-rose-500'
            }`}
          />
          <span>{backendStatus === 'checking' ? 'SYNCING...' : backendStatus.toUpperCase()}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-9 h-9 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-md flex items-center justify-center text-slate-600 dark:text-amber-400 hover:text-sky-600 dark:hover:text-amber-300 shadow-sm transition-all cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Sliding Wrapper for Desktop / Stack for Mobile */}
      <div className="w-full h-screen hidden lg:flex relative overflow-hidden">
        {/* Animated Brand Panel */}
        <motion.div
          animate={isLogin ? 'login' : 'signup'}
          variants={panelVariants}
          className="w-1/2 h-full absolute left-0 z-20 flex flex-col justify-center items-center p-12 lg:p-16 text-white bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 border-r border-slate-800/80 select-none"
        >
          <AnimatedWaveBackground />

          <div className="relative z-10 max-w-md w-full">
            {/* Wordmark & Brand Badge */}
            <Link to="/" className="inline-flex items-center space-x-3 mb-8 group">
              <div className="w-10 h-10 rounded-md bg-white/10 border border-white/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">Learnflow</span>
                <span className="text-xs font-mono text-sky-400 font-semibold">[LMS]</span>
              </div>
            </Link>

            {/* Dynamic Text Information */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login-brand' : 'register-brand'}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={textVariants}
              >
                <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300 text-xs font-mono mb-4">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isLogin ? 'Institutional Access Gate' : 'Learner Self-Provisioning'}</span>
                </div>

                <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight mb-4">
                  {isLogin ? (
                    <>
                      Server-Authoritative <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-300">
                        Education & Assessment
                      </span>
                    </>
                  ) : (
                    <>
                      Empowering Technical <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-300">
                        Engineers & Scholars
                      </span>
                    </>
                  )}
                </h1>

                <p className="text-sm text-slate-300 leading-relaxed mb-8">
                  {isLogin
                    ? 'Authenticate to enter your role-authorized workspace. Complete sequential technical lessons, timed examination arenas, and earn verifiable cryptographic certificates.'
                    : 'Create your authenticated learner profile to explore curated computer science curricula, diagnose knowledge gaps, and benchmark skills with auto-grading.'}
                </p>

                {/* Institutional Notice Box */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm mb-8 text-xs text-slate-300 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    <span>Platform Standard</span>
                    <span className="text-sky-400">LF-AUTH-v2</span>
                  </div>
                  <p className="leading-relaxed text-slate-300">
                    Governed by 64-bit advisory concurrency locks, Argon2 password security, and immutable SHA-256 audit log chains.
                  </p>
                </div>

                {/* Brand Tagline */}
                <div className="border-l-2 border-sky-500 pl-3.5 text-xs italic text-sky-200">
                  &quot;Rigorous technical education governed by deterministic evaluation integrity.&quot;
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Sliding Form Panel */}
        <motion.div
          animate={isLogin ? 'login' : 'signup'}
          variants={formPanelVariants}
          className="w-1/2 h-full absolute right-0 z-10 flex flex-col justify-center items-center p-8 lg:p-12 bg-white dark:bg-slate-900 overflow-y-auto"
        >
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </motion.div>
      </div>

      {/* Mobile / Tablet Responsive Fallback Layout */}
      <div className="lg:hidden min-h-screen py-16 px-4 sm:px-6 flex flex-col justify-center items-center">
        <Link to="/" className="inline-flex items-center space-x-2.5 mb-6">
          <div className="w-9 h-9 rounded-md bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center border border-slate-800">
            <GraduationCap className="w-5 h-5 text-sky-400" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">Learnflow [LMS]</span>
        </Link>
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-subtle">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

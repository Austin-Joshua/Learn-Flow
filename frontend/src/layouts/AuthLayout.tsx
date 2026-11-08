import React from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useLocation, Outlet, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { AnimatedWaveBackground } from '../components/auth/AnimatedWaveBackground';
import { motionTokens } from '../utils/motion';
import { GraduationCap, Sun, Moon, ShieldCheck } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const isLogin = location.pathname === '/login';

  const panelVariants: Variants = {
    login: { x: 0, transition: { duration: 0.45, ease: motionTokens.ease } },
    signup: { x: '100%', transition: { duration: 0.45, ease: motionTokens.ease } },
  };

  const formPanelVariants: Variants = {
    login: { x: 0, transition: { duration: 0.45, ease: motionTokens.ease } },
    signup: { x: '-100%', transition: { duration: 0.45, ease: motionTokens.ease } },
  };

  const textVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.3 } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.15 } },
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center relative overflow-hidden transition-colors duration-300 font-sans">
      {/* Top Controls: Dark/Light Mode */}
      <div className="absolute top-5 right-6 z-50 flex items-center">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-amber-400 hover:text-sky-600 dark:hover:text-amber-300 shadow-xs transition-colors cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main Sliding Wrapper for Desktop / Stack for Mobile */}
      <div className="w-full h-screen hidden lg:flex relative overflow-hidden">
        {/* Animated Brand Panel: Light in light mode; Deep dark in dark mode */}
        <motion.div
          animate={isLogin ? 'login' : 'signup'}
          variants={panelVariants}
          className="w-1/2 h-full absolute left-0 z-20 flex flex-col justify-center items-center p-12 lg:p-16 bg-slate-100 dark:bg-slate-950 border-r border-slate-300 dark:border-slate-800 select-none transition-colors duration-300"
        >
          <AnimatedWaveBackground />

          <div className="relative z-10 max-w-md w-full">
            {/* Wordmark & Brand Badge */}
            <Link to="/" className="inline-flex items-center space-x-3 mb-8 group">
              <div className="w-9 h-9 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[#0082fb] dark:text-sky-400 shadow-sm transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-950 dark:text-white transition-colors">Learnflow</span>
                <span className="text-xs font-mono text-[#0082fb] dark:text-sky-400 font-semibold">[LMS]</span>
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
                <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-sky-500/15 dark:bg-sky-500/15 border border-sky-500/30 dark:border-sky-400/30 text-sky-900 dark:text-sky-300 text-xs font-semibold mb-4 transition-colors">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0082fb] dark:text-sky-400" />
                  <span>{isLogin ? 'Secure Academic Access' : 'Create Student Account'}</span>
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-950 dark:text-white leading-tight mb-4 transition-colors">
                  {isLogin ? (
                    <>
                      Structured Learning &amp; <br />
                      <span className="text-[#0082fb] dark:text-sky-400">
                        Verified Assessment
                      </span>
                    </>
                  ) : (
                    <>
                      Start Your Journey in <br />
                      <span className="text-[#0082fb] dark:text-sky-400">
                        Computer Science
                      </span>
                    </>
                  )}
                </h1>

                <p className="text-sm text-slate-800 dark:text-slate-300 font-medium leading-relaxed mb-8 transition-colors">
                  {isLogin
                    ? 'Sign in to access your course materials, interactive coding exercises, assignment feedback, and verified course certificates.'
                    : 'Create your learner profile to explore curated computing courses, diagnose knowledge gaps, and build verifiable skills.'}
                </p>

                {/* Institutional Notice Box */}
                <div className="p-4 rounded-lg bg-white dark:bg-white/5 border border-slate-300/80 dark:border-white/10 backdrop-blur-sm mb-8 text-xs text-slate-800 dark:text-slate-300 shadow-sm dark:shadow-none space-y-2 transition-colors">
                  <div className="flex items-center justify-between text-label font-mono uppercase tracking-wider">
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">Academic Standard</span>
                    <span className="text-[#0082fb] dark:text-sky-400 font-bold">Learnflow Verified</span>
                  </div>
                  <p className="leading-relaxed text-slate-800 dark:text-slate-300 font-medium">
                    Protected by secure session encryption, academic integrity verification, and reliable student progress tracking.
                  </p>
                </div>

                {/* Brand Tagline */}
                <div className="border-l-2 border-[#0082fb] dark:border-sky-500 pl-3.5 text-xs text-slate-900 dark:text-sky-200 font-semibold transition-colors">
                  Focused, rigorous education designed for genuine technical mastery.
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Sliding Form Panel: Dark in light mode; Light in dark mode */}
        <motion.div
          animate={isLogin ? 'login' : 'signup'}
          variants={formPanelVariants}
          className="w-1/2 h-full absolute right-0 z-10 flex flex-col justify-center items-center p-8 lg:p-12 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 overflow-y-auto transition-colors duration-300"
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
        <div className="w-full max-w-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border border-slate-800 dark:border-slate-300 rounded-xl p-6 sm:p-8 shadow-subtle transition-colors">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

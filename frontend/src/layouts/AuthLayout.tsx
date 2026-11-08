import React from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useLocation, Outlet, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { AnimatedWaveBackground } from '../components/auth/AnimatedWaveBackground';
import { GraduationCap, Sun, Moon, ShieldCheck } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const isLogin = location.pathname === '/login';

  const ease: [number, number, number, number] = [0.4, 0, 0.2, 1];

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
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 flex flex-col justify-center relative overflow-hidden transition-colors duration-300 font-sans">
      {/* Floating Dark Mode Toggle with Spring Rotation Animation */}
      <div className="fixed top-5 right-6 z-50">
        <motion.button
          onClick={toggleTheme}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDarkMode ? 'dark-sun' : 'light-moon'}
              initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="flex items-center justify-center"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Main Sliding Wrapper for Desktop / Stack for Mobile */}
      <div className="w-full h-screen hidden lg:flex relative overflow-hidden">
        {/* Animated Brand Panel: Deep rich navy blue brand background in both modes */}
        <motion.div
          animate={isLogin ? 'login' : 'signup'}
          variants={panelVariants}
          className="w-1/2 h-full absolute left-0 z-20 flex flex-col justify-center items-center p-12 lg:p-16 bg-gradient-to-br from-[#0B2C6B] via-[#0d347d] to-[#123C8C] dark:from-[#051329] dark:via-[#081e47] dark:to-[#0B2C6B] text-white border-r border-blue-900/40 select-none overflow-hidden transition-colors duration-300"
        >
          <AnimatedWaveBackground />

          <div className="relative z-10 max-w-md w-full">
            {/* Wordmark & Brand Badge */}
            <Link to="/" className="inline-flex items-center space-x-3 mb-8 group">
              <div className="w-9 h-9 rounded-md bg-white/10 dark:bg-white/10 border border-white/20 flex items-center justify-center text-sky-400 shadow-sm transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-bold tracking-tight text-white transition-colors">Learnflow</span>
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
                <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-semibold mb-4 transition-colors">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isLogin ? 'Secure Academic Access' : 'Create Student Account'}</span>
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight mb-4 transition-colors">
                  {isLogin ? (
                    <>
                      Structured Learning &amp; <br />
                      <span className="text-sky-400">
                        Verified Assessment
                      </span>
                    </>
                  ) : (
                    <>
                      Start Your Journey in <br />
                      <span className="text-sky-400">
                        Computer Science
                      </span>
                    </>
                  )}
                </h1>

                <p className="text-sm text-slate-200 font-medium leading-relaxed mb-8 transition-colors">
                  {isLogin
                    ? 'Sign in to access your course materials, interactive coding exercises, assignment feedback, and verified course certificates.'
                    : 'Create your learner profile to explore curated computing courses, diagnose knowledge gaps, and build verifiable skills.'}
                </p>

                {/* Institutional Notice Box */}
                <div className="p-4 rounded-lg bg-white/10 dark:bg-black/30 border border-white/15 backdrop-blur-sm mb-8 text-xs text-slate-200 shadow-sm space-y-2 transition-colors">
                  <div className="flex items-center justify-between text-label font-mono uppercase tracking-wider">
                    <span className="text-slate-300 font-semibold">Academic Standard</span>
                    <span className="text-sky-400 font-bold">Learnflow Verified</span>
                  </div>
                  <p className="leading-relaxed text-slate-200 font-medium">
                    Protected by secure session encryption, academic integrity verification, and reliable student progress tracking.
                  </p>
                </div>

                {/* Brand Tagline */}
                <div className="border-l-2 border-sky-400 pl-3.5 text-xs text-sky-200 font-semibold transition-colors">
                  Focused, rigorous education designed for genuine technical mastery.
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Sliding Form Panel: Smooth position swap with Brand Panel */}
        <motion.div
          animate={isLogin ? 'login' : 'signup'}
          variants={formPanelVariants}
          className="w-1/2 h-full absolute right-0 z-10 flex flex-col justify-center items-center p-8 lg:p-12 bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 overflow-y-auto transition-colors duration-300"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-8 sm:p-10 shadow-xl dark:shadow-2xl transition-all duration-300">
            <Outlet />
          </div>
        </motion.div>
      </div>

      {/* Mobile / Tablet Responsive Fallback Layout */}
      <div className="lg:hidden min-h-screen py-16 px-4 sm:px-6 flex flex-col justify-center items-center">
        <Link to="/" className="inline-flex items-center space-x-2.5 mb-6">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-[#0B2C6B] to-[#123C8C] text-white flex items-center justify-center border border-blue-900/40 shadow-xs">
            <GraduationCap className="w-5 h-5 text-sky-400" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">Learnflow [LMS]</span>
        </Link>
        <div className="w-full max-w-md bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl transition-all duration-300">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

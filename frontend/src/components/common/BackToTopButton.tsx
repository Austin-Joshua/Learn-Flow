import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface BackToTopButtonProps {
  threshold?: number;
  className?: string;
}

export const BackToTopButton: React.FC<BackToTopButtonProps> = ({
  threshold = 300,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  // Scroll to top automatically when navigating to a new route
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
    setIsVisible(false);
    setScrollProgress(0);
  }, [location.pathname]);

  const handleScroll = useCallback(() => {
    const currentScrollY =
      window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const scrollHeight =
      document.documentElement.scrollHeight - document.documentElement.clientHeight;

    if (scrollHeight > 0) {
      const progress = Math.min(100, Math.max(0, (currentScrollY / scrollHeight) * 100));
      setScrollProgress(progress);
    }

    if (currentScrollY > threshold) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [threshold]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
    if (typeof document !== 'undefined') {
      if (typeof document.documentElement?.scrollTo === 'function') {
        document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document.documentElement.scrollTop = 0;
      }
      if (typeof document.body?.scrollTo === 'function') {
        document.body.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document.body.scrollTop = 0;
      }
      const main = document.getElementById('main-content');
      if (main) {
        if (typeof main.scrollTo === 'function') {
          main.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          main.scrollTop = 0;
        }
      }
    }
  };

  // Check if Copilot is active on this screen to position BackToTop alongside it on desktop
  const isCopilotActive =
    isAuthenticated &&
    !(
      location.pathname === '/' ||
      location.pathname === '/login' ||
      location.pathname === '/register' ||
      location.pathname === '/signup' ||
      location.pathname.startsWith('/verify') ||
      location.pathname.startsWith('/lessons/') ||
      location.pathname.startsWith('/assessments/')
    );

  // SVG Circular Ring calculation (radius = 16, circumference = 2 * PI * 16 ≈ 100.53)
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          initial={{ opacity: 0, y: 16, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.85 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          aria-label="Back to top of page"
          title={`Back to top (${Math.round(scrollProgress)}% scrolled)`}
          className={`fixed z-40 group flex items-center justify-center cursor-pointer select-none
            bottom-20 right-4 ${isCopilotActive ? 'md:bottom-6 md:right-24' : 'md:bottom-6 md:right-6'}
            w-10 h-10 sm:w-11 sm:h-11 rounded-full
            bg-white/95 dark:bg-slate-900/95 backdrop-blur-md
            text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400
            border border-slate-200/90 dark:border-white/15
            shadow-[0_4px_16px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]
            hover:shadow-[0_6px_20px_rgba(0,130,251,0.25)]
            focus:outline-none focus:ring-2 focus:ring-sky-500/50
            transition-colors duration-150 ${className}`}
        >
          {/* Progress Ring */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5"
            viewBox="0 0 36 36"
            aria-hidden="true"
          >
            <circle
              cx="18"
              cy="18"
              r={radius}
              className="text-slate-200/60 dark:text-slate-800/80"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="none"
            />
            <circle
              cx="18"
              cy="18"
              r={radius}
              className="text-sky-500 transition-all duration-150"
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
            />
          </svg>

          {/* Central Arrow Up Icon */}
          <ArrowUp className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:-translate-y-0.5 transition-transform duration-200 relative z-10" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

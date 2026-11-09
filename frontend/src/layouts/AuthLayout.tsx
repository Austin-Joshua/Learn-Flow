import React from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useLocation, Outlet, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { AnimatedWaveBackground } from '../components/auth/AnimatedWaveBackground';
import { Sun, Moon } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const isLogin = location.pathname === '/login';

  const ease: [number, number, number, number] = [0.4, 0, 0.2, 1];

  const panelVariants: Variants = {
    login: { x: 0, transition: { duration: 0.4, ease } },
    signup: { x: '100%', transition: { duration: 0.4, ease } },
  };

  const formPanelVariants: Variants = {
    login: { x: 0, transition: { duration: 0.4, ease } },
    signup: { x: '-100%', transition: { duration: 0.4, ease } },
  };

  const textVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.3 } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.15 } },
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: 'var(--auth-bg-page)',
        display: 'flex',
        position: 'relative',
        transition: 'var(--auth-transition-standard)',
        overflow: 'hidden',
      }}
    >
      {/* Floating Dark Mode Toggle */}
      <div style={{ position: 'fixed', top: '20px', right: '24px', zIndex: 100 }}>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDarkMode ? 'Current mode: Dark (click for Light)' : 'Current mode: Light (click for Dark)'}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--auth-toggle-bg)',
            color: 'var(--auth-toggle-color)',
            border: 'var(--auth-toggle-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--auth-transition-standard)',
            cursor: 'pointer',
            boxShadow: 'var(--auth-toggle-shadow)',
          }}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
      </div>

      {/* Main Sliding Dual-Panel Container */}
      <div className="auth-wrapper" style={{ display: 'flex', width: '100%', height: '100vh', position: 'relative' }}>
        {/* Brand / Details Panel */}
        <motion.div
          className="brand-panel"
          animate={isLogin ? 'login' : 'signup'}
          variants={panelVariants}
          style={{
            width: '50%',
            height: '100%',
            background: 'var(--auth-brand-bg)',
            position: 'absolute',
            left: 0,
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '60px',
            color: 'var(--auth-brand-text, #ffffff)',
            overflow: 'hidden',
            borderRight: 'var(--auth-brand-border)',
            transition: 'var(--auth-transition-standard)',
          }}
        >
          <AnimatedWaveBackground isLightBrand={!isDarkMode} isReduced={isDarkMode} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '440px', width: '100%', textAlign: 'center' }}>
            {/* Wordmark Logo with Theme Mode Shift */}
            <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'center' }}>
              <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }} title="Learnflow">
                <img
                  src={isDarkMode ? '/learnflow-logo-dark.png' : '/learnflow-logo-light.png'}
                  alt="Learnflow"
                  style={{ height: '38px', width: 'auto', objectFit: 'contain', transition: 'opacity 0.2s ease' }}
                />
              </Link>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login-info' : 'signup-info'}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={textVariants}
              >
                <h1
                  style={{
                    fontSize: '2.25rem',
                    fontWeight: 800,
                    marginBottom: '12px',
                    lineHeight: 1.2,
                    color: 'var(--auth-brand-text, #ffffff)',
                    letterSpacing: '-0.02em',
                    transition: 'color 0.35s ease',
                  }}
                >
                  {isLogin ? (
                    <>
                      Welcome to <br />
                      <span style={{ color: isDarkMode ? '#3aa0ff' : '#0082fb' }}>
                        Learnflow
                      </span>
                    </>
                  ) : (
                    <>
                      Start Your Journey with <br />
                      <span style={{ color: isDarkMode ? '#3aa0ff' : '#0082fb' }}>
                        Learnflow
                      </span>
                    </>
                  )}
                </h1>
                <p
                  style={{
                    fontSize: '0.95rem',
                    color: 'var(--auth-brand-subtext, #cbd5e1)',
                    margin: 0,
                    lineHeight: 1.6,
                    fontWeight: 400,
                    transition: 'color 0.35s ease',
                  }}
                >
                  {isLogin
                    ? 'Sign in to access your courses, complete assignments, and track your verified progress.'
                    : 'Create your account to explore courses, build in-demand skills, and earn verified certificates.'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Form Panel */}
        <motion.div
          className="form-panel"
          animate={isLogin ? 'login' : 'signup'}
          variants={formPanelVariants}
          style={{
            width: '50%',
            height: '100%',
            position: 'absolute',
            right: 0,
            zIndex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            overflowY: 'auto',
            backgroundColor: 'var(--auth-bg-page)',
            color: 'var(--auth-text-primary)',
            transition: 'var(--auth-transition-standard)',
          }}
        >
          <div style={{ maxWidth: '440px', width: '100%' }}>
            <Outlet />
          </div>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .auth-wrapper { 
            flex-direction: column !important; 
            overflow-y: auto !important; 
            height: auto !important; 
            min-height: 100vh !important; 
            justify-content: flex-start !important; 
            align-items: center !important;
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
          }
          .brand-panel, .form-panel { 
            width: 100% !important; 
            position: relative !important; 
            transform: none !important; 
            left: auto !important; 
            right: auto !important; 
            margin: 0 !important;
          }
          .brand-panel { 
            padding: 32px 20px 24px !important; 
            height: auto !important; 
            z-index: 10 !important; 
            display: flex !important; 
            flex-direction: column !important; 
            align-items: center !important; 
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
          }
          .brand-panel h1 { font-size: 1.4rem !important; margin-bottom: 6px !important; }
          .brand-panel p, .brand-description, .brand-tagline { display: none !important; }
          .form-panel { 
            padding: 40px 20px !important; 
            height: auto !important; 
            display: flex !important; 
            justify-content: center !important; 
            align-items: flex-start !important; 
            z-index: 1 !important;
            flex: 1;
          }
          .auth-form-wrapper { width: 100% !important; max-width: 440px !important; margin: 0 auto !important; }
        }
        @media (max-width: 480px) {
          .brand-panel { padding: 16px 16px 12px !important; }
          .brand-panel h1 { font-size: 1.2rem !important; }
          .form-panel { padding: 16px 12px !important; }
          .auth-form-wrapper { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};

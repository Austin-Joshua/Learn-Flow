import React from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useLocation, Outlet, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { AnimatedWaveBackground } from '../components/auth/AnimatedWaveBackground';
import { Sun, Moon, ShieldCheck } from 'lucide-react';

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
          <AnimatedWaveBackground isReduced={isDarkMode} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '450px', width: '100%' }}>
            {/* Wordmark & Brand Badge */}
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
              <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <img
                  src="/learnflow-logo-dark.png"
                  alt="Learnflow"
                  style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
                />
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: '#3aa0ff',
                    background: 'rgba(0,130,251,0.25)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid rgba(0,130,251,0.4)',
                    transition: 'all 0.35s ease',
                  }}
                >
                  [LMS]
                </span>
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
                {/* Academic Access Pill */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    background: 'rgba(0, 130, 251, 0.2)',
                    border: '1px solid rgba(0, 130, 251, 0.4)',
                    color: '#3aa0ff',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    transition: 'all 0.35s ease',
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>{isLogin ? 'Secure Academic Access' : 'Create Student Account'}</span>
                </div>

                <h1
                  style={{
                    fontSize: '2.4rem',
                    fontWeight: 800,
                    marginBottom: '10px',
                    lineHeight: 1.15,
                    color: '#ffffff',
                  }}
                >
                  {isLogin ? (
                    <>
                      Structured Learning &amp; <br />
                      <span style={{ color: '#3aa0ff' }}>
                        Verified Assessment
                      </span>
                    </>
                  ) : (
                    <>
                      Start Your Journey in <br />
                      <span style={{ color: '#3aa0ff' }}>
                        Computer Science
                      </span>
                    </>
                  )}
                </h1>
                <p
                  style={{
                    fontSize: '0.95rem',
                    color: '#cbd5e1',
                    marginBottom: '28px',
                    lineHeight: 1.6,
                    fontWeight: 500,
                  }}
                >
                  {isLogin
                    ? 'Sign in to access your course materials, interactive coding exercises, assignment feedback, and verified course certificates.'
                    : 'Create your learner profile to explore curated computing courses, diagnose knowledge gaps, and build verifiable skills.'}
                </p>

                {/* Institutional Description / Verification Box */}
                <div
                  className="brand-description"
                  style={{
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    marginBottom: '28px',
                    padding: '16px 20px',
                    background: 'var(--auth-brand-desc-bg)',
                    borderRadius: '12px',
                    border: 'var(--auth-brand-desc-border)',
                    borderLeft: '3px solid #3aa0ff',
                    boxShadow: 'var(--auth-brand-desc-shadow)',
                    color: '#cbd5e1',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span style={{ fontWeight: 600, color: '#94a3b8' }}>Academic Standard</span>
                    <span style={{ fontWeight: 700, color: '#3aa0ff' }}>Learnflow Verified</span>
                  </div>
                  <p style={{ margin: 0, fontWeight: 500, color: '#cbd5e1' }}>
                    Protected by secure session encryption, academic integrity verification, and reliable student progress tracking.
                  </p>
                </div>

                {/* Tagline */}
                <div
                  className="brand-tagline"
                  style={{
                    fontSize: '0.9rem',
                    color: '#f2f5f9',
                    fontWeight: 600,
                    borderLeft: '3px solid #3aa0ff',
                    paddingLeft: '14px',
                  }}
                >
                  Focused, rigorous education designed for genuine technical mastery.
                </div>
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

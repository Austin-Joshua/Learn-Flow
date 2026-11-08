import React from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useLocation, Outlet, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { AnimatedWaveBackground } from '../components/auth/AnimatedWaveBackground';
import { GraduationCap, Sun, Moon } from 'lucide-react';

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
        backgroundColor: 'var(--theme-bg)',
        display: 'flex',
        position: 'relative',
        transition: 'background-color var(--transition-speed)',
        overflow: 'hidden',
      }}
    >
      {/* Floating Dark Mode Toggle */}
      <div style={{ position: 'fixed', top: '20px', right: '25px', zIndex: 100 }}>
        <button
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            padding: '12px',
            borderRadius: '50%',
            cursor: 'pointer',
            color: 'var(--color-accent-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            boxShadow: 'var(--shadow-subtle)',
            fontSize: '18px',
          }}
        >
          {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      {/* Main Sliding Dual-Panel Container */}
      <div className="auth-wrapper" style={{ display: 'flex', width: '100%', height: '100vh', position: 'relative' }}>
        <motion.div
          className="brand-panel"
          animate={isLogin ? 'login' : 'signup'}
          variants={panelVariants}
          style={{
            width: '50%',
            height: '100%',
            background: 'linear-gradient(135deg, #0B2C6B 0%, #123C8C 100%)',
            position: 'absolute',
            left: 0,
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '60px',
            color: '#ffffff',
            overflow: 'hidden',
          }}
        >
          <AnimatedWaveBackground />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '450px', width: '100%' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
              <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#ffffff' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-accent-gold)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  <GraduationCap size={26} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                    Learn<span style={{ color: 'var(--color-accent-gold)' }}>flow</span>
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: 'var(--color-accent-gold)',
                      background: 'rgba(212,175,55,0.15)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    [LMS]
                  </span>
                </div>
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
                <h1 style={{ fontSize: '2.8rem', fontWeight: 800, marginBottom: '8px', lineHeight: 1.2, color: '#ffffff' }}>
                  Learn<span style={{ color: 'var(--color-accent-gold)' }}>flow</span>
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '40px', lineHeight: 1.6, fontWeight: 500 }}>
                  {isLogin ? 'Smart Academic Intelligence Platform' : 'Academic Mastery & Verified Credentials'}
                </p>

                <div
                  className="brand-description"
                  style={{
                    fontSize: '0.95rem',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.85)',
                    lineHeight: 1.7,
                    marginBottom: '40px',
                    padding: '16px',
                    background: 'rgba(0,0,0,0.12)',
                    borderRadius: '12px',
                    borderLeft: `2px solid ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)'}`,
                  }}
                >
                  {isLogin
                    ? 'Sign in to access your course materials, interactive coding exercises, assignment feedback, and verified course certificates.'
                    : 'Create your learner profile to explore curated computing courses, diagnose knowledge gaps, and build verifiable skills.'}
                </div>

                <div
                  className="brand-tagline"
                  style={{
                    fontSize: '1rem',
                    fontStyle: 'italic',
                    color: 'var(--color-accent-gold)',
                    fontWeight: 500,
                    marginTop: '50px',
                    borderLeft: '3px solid var(--color-accent-gold)',
                    paddingLeft: '16px',
                  }}
                >
                  &quot;Innovation through data, excellence in education.&quot;
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

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
            background: var(--theme-bg) !important;
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
            box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
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

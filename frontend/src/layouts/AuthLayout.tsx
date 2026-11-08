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

  // Contrast UI rule:
  // - In Dark Mode: Brand panel adapts the darker navy palette with white text.
  // - In Light Mode: Brand panel adapts the lighter luminous palette with dark text.
  const isBrandLight = !isDarkMode;

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
            transition: 'all var(--transition-speed)',
          }}
        >
          {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
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
            background: isBrandLight
              ? 'linear-gradient(135deg, #F0F4F8 0%, #E2E8F0 100%)'
              : 'linear-gradient(135deg, #0B2C6B 0%, #123C8C 100%)',
            position: 'absolute',
            left: 0,
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '60px',
            color: isBrandLight ? '#0F172A' : '#ffffff',
            overflow: 'hidden',
            borderRight: isBrandLight ? '1px solid #CBD5E1' : 'none',
            transition: 'background 0.35s ease, color 0.35s ease, border-color 0.35s ease',
          }}
        >
          <AnimatedWaveBackground isLightBrand={isBrandLight} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '450px', width: '100%' }}>
            {/* Wordmark & Brand Badge */}
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
              <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: isBrandLight ? '#ffffff' : 'rgba(255,255,255,0.12)',
                    border: isBrandLight ? '1.5px solid #CBD5E1' : '1px solid rgba(255,255,255,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isBrandLight ? '#0082fb' : 'var(--color-accent-gold)',
                    boxShadow: isBrandLight ? '0 2px 8px rgba(0,0,0,0.06)' : '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.35s ease',
                  }}
                >
                  <GraduationCap size={26} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      color: isBrandLight ? '#0F172A' : '#ffffff',
                      transition: 'color 0.35s ease',
                    }}
                  >
                    Learn
                    <span style={{ color: isBrandLight ? '#0082fb' : 'var(--color-accent-gold)' }}>
                      flow
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: isBrandLight ? '#0082fb' : 'var(--color-accent-gold)',
                      background: isBrandLight ? 'rgba(0,130,251,0.12)' : 'rgba(212,175,55,0.15)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      transition: 'all 0.35s ease',
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
                {/* Academic Access Pill */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    background: isBrandLight ? 'rgba(2, 132, 199, 0.12)' : 'rgba(56, 189, 248, 0.15)',
                    border: isBrandLight ? '1px solid rgba(2, 132, 199, 0.25)' : '1px solid rgba(255, 255, 255, 0.2)',
                    color: isBrandLight ? '#0284c7' : '#7dd3fc',
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
                    fontSize: '2.8rem',
                    fontWeight: 800,
                    marginBottom: '8px',
                    lineHeight: 1.2,
                    color: isBrandLight ? '#0F172A' : '#ffffff',
                    transition: 'color 0.35s ease',
                  }}
                >
                  Learn
                  <span style={{ color: isBrandLight ? '#0082fb' : 'var(--color-accent-gold)' }}>
                    flow
                  </span>
                </h1>
                <p
                  style={{
                    fontSize: '1.2rem',
                    color: isBrandLight ? '#475569' : 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '40px',
                    lineHeight: 1.6,
                    fontWeight: 500,
                    transition: 'color 0.35s ease',
                  }}
                >
                  {isLogin ? 'Smart Academic Intelligence Platform' : 'Academic Mastery & Verified Credentials'}
                </p>

                {/* Institutional Description / Verification Box */}
                <div
                  className="brand-description"
                  style={{
                    fontSize: '0.95rem',
                    lineHeight: 1.7,
                    marginBottom: '40px',
                    padding: '16px',
                    background: isBrandLight ? '#ffffff' : 'rgba(0,0,0,0.15)',
                    borderRadius: '12px',
                    border: isBrandLight ? '1px solid #E2E8F0' : '1px solid rgba(255,255,255,0.15)',
                    borderLeft: `3px solid ${isBrandLight ? '#0082fb' : 'var(--color-accent-gold)'}`,
                    boxShadow: isBrandLight ? '0 4px 14px rgba(0,0,0,0.06)' : 'none',
                    color: isBrandLight ? '#334155' : 'rgba(255, 255, 255, 0.85)',
                    transition: 'all 0.35s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span style={{ fontWeight: 600, color: isBrandLight ? '#64748B' : 'rgba(255, 255, 255, 0.65)' }}>Academic Standard</span>
                    <span style={{ fontWeight: 700, color: isBrandLight ? '#0082fb' : 'var(--color-accent-gold)' }}>Learnflow Verified</span>
                  </div>
                  <p style={{ margin: 0, fontWeight: 500 }}>
                    {isLogin
                      ? 'Sign in to access your course materials, interactive coding exercises, assignment feedback, and verified course certificates.'
                      : 'Create your learner profile to explore curated computing courses, diagnose knowledge gaps, and build verifiable skills.'}
                  </p>
                </div>

                {/* Tagline */}
                <div
                  className="brand-tagline"
                  style={{
                    fontSize: '1rem',
                    fontStyle: 'italic',
                    color: isBrandLight ? '#0F172A' : 'var(--color-accent-gold)',
                    fontWeight: 600,
                    marginTop: '50px',
                    borderLeft: `3px solid ${isBrandLight ? '#0082fb' : 'var(--color-accent-gold)'}`,
                    paddingLeft: '16px',
                    transition: 'all 0.35s ease',
                  }}
                >
                  &quot;Innovation through data, excellence in education.&quot;
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Form Panel (Reflects current mode: light in light mode, dark in dark mode) */}
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

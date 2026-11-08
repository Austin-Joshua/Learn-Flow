import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { LogIn, AlertCircle, KeyRound, Mail, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface LocationState {
  from?: {
    pathname: string;
  };
}

const AUTH_PRIMARY_BLUE = '#0082fb';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [highlightPassword, setHighlightPassword] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const { login, isLoading, error, clearError, isAuthenticated, getDefaultDashboardPath } = useAuthStore();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isDemoPersonasEnabled = import.meta.env.VITE_ENABLE_DEMO_PERSONAS === 'true';

  const demoPersonas = isDemoPersonasEnabled
    ? [
      {
        role: 'Learner',
        label: 'Student',
        email: import.meta.env.VITE_DEMO_LEARNER_EMAIL || '',
        password: import.meta.env.VITE_DEMO_LEARNER_PASSWORD || '',
      },
      {
        role: 'Instructor',
        label: 'Faculty',
        email: import.meta.env.VITE_DEMO_INSTRUCTOR_EMAIL || '',
        password: import.meta.env.VITE_DEMO_INSTRUCTOR_PASSWORD || '',
      },
      {
        role: 'HOD',
        label: 'Dept Head',
        email: import.meta.env.VITE_DEMO_HOD_EMAIL || '',
        password: import.meta.env.VITE_DEMO_HOD_PASSWORD || '',
      },
      {
        role: 'Admin',
        label: 'Sys Admin',
        email: import.meta.env.VITE_DEMO_ADMIN_EMAIL || '',
        password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || '',
      },
    ].filter((p) => Boolean(p.email && p.password))
    : [];

  const selectedPersona = demoPersonas.find((p) => p.email === email);

  useEffect(() => {
    if (isAuthenticated) {
      const fromPath = (location.state as LocationState)?.from?.pathname;
      const target = fromPath && fromPath !== '/login' ? fromPath : getDefaultDashboardPath();
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, navigate, getDefaultDashboardPath, location.state]);

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    clearError();
    const success = await login(loginEmail, loginPass);
    if (success) {
      const from = (location.state as LocationState | null)?.from?.pathname;
      const target = from && from !== '/' && from !== '/login' ? from : getDefaultDashboardPath();
      navigate(target, { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  const handleSelectPersona = (pEmail: string, pPass: string) => {
    setEmail(pEmail);
    setPassword(pPass);
    clearError();
    setHighlightPassword(true);
    setTimeout(() => setHighlightPassword(false), 1400);
    passwordInputRef.current?.focus();
  };

  const handleDirectSignIn = async (pEmail: string, pPass: string) => {
    setEmail(pEmail);
    setPassword(pPass);
    await executeLogin(pEmail, pPass);
  };

  return (
    <div className="auth-form-wrapper">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        style={{
          background: 'var(--card-bg)',
          border: '1.5px solid var(--theme-border)',
          padding: 'clamp(20px, 3.5vw, 32px)',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
          width: '100%',
          maxWidth: '440px',
          position: 'relative',
          zIndex: 2,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h2
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: isDarkMode ? '#f2f5f9' : '#0F172A',
              marginBottom: '4px',
              letterSpacing: '-0.01em',
            }}
          >
            Institutional Access
          </h2>
          <p
            style={{
              color: 'var(--theme-text-muted)',
              fontSize: '0.875rem',
              fontWeight: 500,
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            Enter your authorized credentials to access your personalized learning portal
          </p>
        </div>

        {/* Role Quick Selector (When demo personas are enabled) */}
        {isDemoPersonasEnabled && demoPersonas.length > 0 && (
          <div
            style={{
              marginBottom: '18px',
              padding: '12px',
              borderRadius: '12px',
              background: 'var(--theme-bg)',
              border: '1px solid var(--theme-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7' }} />
                Role Personas (Evaluation)
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--theme-text-muted)' }}>1-Click Auto-Fill</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {demoPersonas.map((persona) => {
                const isSelected = email === persona.email;
                return (
                  <button
                    key={persona.role}
                    type="button"
                    onClick={() => handleSelectPersona(persona.email, persona.password)}
                    style={{
                      height: '52px',
                      padding: '4px 6px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: isSelected ? '1.5px solid #0082fb' : '1px solid var(--theme-border)',
                      background: isSelected ? (isDarkMode ? 'rgba(0, 130, 251, 0.2)' : 'rgba(0, 130, 251, 0.1)') : 'var(--card-bg)',
                      color: isSelected ? (isDarkMode ? '#3aa0ff' : '#0082fb') : 'var(--theme-text)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{persona.role}</span>
                      {isSelected && <CheckCircle2 size={12} color={isDarkMode ? '#3aa0ff' : '#0082fb'} />}
                    </div>
                    <div style={{ fontSize: '10px', opacity: 0.75, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>{persona.label}</div>
                  </button>
                );
              })}
            </div>

            {selectedPersona && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: isDarkMode ? 'rgba(0, 130, 251, 0.12)' : 'rgba(0, 130, 251, 0.08)',
                  border: isDarkMode ? '1px solid rgba(0, 130, 251, 0.3)' : '1px solid rgba(0, 130, 251, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: 'var(--theme-text)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} color={isDarkMode ? '#3aa0ff' : '#0082fb'} />
                  <span>Active: <strong style={{ color: isDarkMode ? '#3aa0ff' : '#0082fb' }}>{selectedPersona.role}</strong></span>
                </span>
                <button
                  type="button"
                  onClick={() => handleDirectSignIn(selectedPersona.email, selectedPersona.password)}
                  disabled={isLoading}
                  style={{
                    height: '28px',
                    padding: '0 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    backgroundColor: AUTH_PRIMARY_BLUE,
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>Instant Sign In</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              color: '#DC2626',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '0.875rem',
              marginBottom: '16px',
              borderLeft: '4px solid #DC2626',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--theme-text)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Email or username
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '0 auto 0 12px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'var(--theme-text-muted)' }}>
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. learner@learnflow.edu"
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '8px 12px 8px 38px',
                  backgroundColor: 'var(--theme-bg)',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '8px',
                  color: 'var(--theme-text)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--theme-text)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Password
              </label>
              {highlightPassword && (
                <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 600, color: isDarkMode ? '#3aa0ff' : '#0082fb' }}>
                  Auto-filled &amp; focused
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '0 auto 0 12px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'var(--theme-text-muted)' }}>
                <KeyRound size={16} />
              </div>
              <input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '8px 40px 8px 38px',
                  backgroundColor: 'var(--theme-bg)',
                  border: highlightPassword ? '1.5px solid #0082fb' : '1px solid var(--theme-border)',
                  borderRadius: '8px',
                  color: 'var(--theme-text)',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--theme-text-muted)',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              marginTop: '6px',
              height: '42px',
              padding: '10px 16px',
              fontSize: '0.95rem',
              borderRadius: '8px',
              backgroundColor: AUTH_PRIMARY_BLUE,
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s ease',
            }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </span>
            ) : (
              <>
                <LogIn size={16} />
                <span>{selectedPersona ? `Sign In as ${selectedPersona.role}` : 'Sign In to Learnflow'}</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', color: 'var(--theme-text-muted)', fontSize: '0.85rem' }}>
          New student to the platform?{' '}
          <Link
            to="/register"
            style={{
              color: isDarkMode ? '#3aa0ff' : '#0082fb',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Create Learner Profile</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

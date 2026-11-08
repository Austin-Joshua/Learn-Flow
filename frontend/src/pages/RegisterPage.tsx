import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { UserPlus, AlertCircle, Shield, Mail, KeyRound, ArrowRight, Eye, EyeOff, User } from 'lucide-react';

const AUTH_PRIMARY_BLUE = '#123D8A';

export const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading, error, clearError, isAuthenticated, getDefaultDashboardPath } = useAuthStore();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      const target = getDefaultDashboardPath();
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, navigate, getDefaultDashboardPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await register({
      first_name: firstName,
      last_name: lastName,
      email,
      password,
    });
    if (success) {
      navigate('/my-learning');
    }
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
        <div style={{ marginBottom: '18px', textAlign: 'center' }}>
          <h2
            style={{
              fontSize: '1.6rem',
              fontWeight: 900,
              color: isDarkMode ? 'var(--color-accent-gold)' : '#B8860B',
              marginBottom: '4px',
              textShadow: isDarkMode ? '0 0 10px rgba(255, 215, 0, 0.25)' : 'none',
              letterSpacing: '0.02em',
            }}
          >
            Create Learner Account
          </h2>
          <p
            style={{
              color: 'var(--theme-text-muted)',
              fontSize: '0.9rem',
              fontWeight: 500,
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            Enroll in accredited courses and track automated assessment progress
          </p>
        </div>

        {/* Institutional Role Notice */}
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'var(--theme-bg)',
            border: '1px solid var(--theme-border)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '0.8rem',
            color: 'var(--theme-text-muted)',
          }}
        >
          <Shield size={16} color="var(--color-accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--theme-text)' }}>Role Notice:</strong> Self-registration provisions student learner access. Faculty credentials require departmental assignment.
          </p>
        </div>

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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                First name
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: '0 auto 0 12px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'var(--theme-text-muted)' }}>
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ada"
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '8px 12px 8px 36px',
                    backgroundColor: 'var(--theme-bg)',
                    border: '1px solid var(--theme-border)',
                    borderRadius: '8px',
                    color: 'var(--theme-text)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
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
                Last name
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: '0 auto 0 12px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'var(--theme-text-muted)' }}>
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Lovelace"
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '8px 12px 8px 36px',
                    backgroundColor: 'var(--theme-bg)',
                    border: '1px solid var(--theme-border)',
                    borderRadius: '8px',
                    color: 'var(--theme-text)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

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
              Institutional email address
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
                placeholder="ada@university.edu"
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '8px 12px 8px 36px',
                  backgroundColor: 'var(--theme-bg)',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '8px',
                  color: 'var(--theme-text)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

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
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '0 auto 0 12px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'var(--theme-text-muted)' }}>
                <KeyRound size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '8px 40px 8px 36px',
                  backgroundColor: 'var(--theme-bg)',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '8px',
                  color: 'var(--theme-text)',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  outline: 'none',
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
                <span>Creating account...</span>
              </span>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Register as Learner</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', color: 'var(--theme-text-muted)', fontSize: '0.85rem' }}>
          Already registered?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--color-accent-gold)',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Sign In to Account</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

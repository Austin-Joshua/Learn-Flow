import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { UserPlus, AlertCircle, Shield, Mail, KeyRound, ArrowRight, Eye, EyeOff, User } from 'lucide-react';

const AUTH_PRIMARY_BLUE = '#0082fb';

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
          background: isDarkMode ? '#06080c' : '#ffffff',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
          padding: 'clamp(20px, 3.5vw, 32px)',
          borderRadius: '16px',
          boxShadow: isDarkMode ? '0 12px 40px rgba(0, 0, 0, 0.6)' : '0 12px 40px rgba(0, 0, 0, 0.05)',
          width: '100%',
          maxWidth: '440px',
          position: 'relative',
          zIndex: 2,
          boxSizing: 'border-box',
          transition: 'background-color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
        }}
      >
        <div style={{ marginBottom: '18px', textAlign: 'center' }}>
          <h2
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: isDarkMode ? '#f2f5f9' : '#0F172A',
              marginBottom: '4px',
              letterSpacing: '-0.01em',
              transition: 'color 0.35s ease',
            }}
          >
            Create Learner Account
          </h2>
          <p
            style={{
              color: isDarkMode ? '#8a94a6' : '#475569',
              fontSize: '0.875rem',
              fontWeight: 500,
              lineHeight: 1.4,
              margin: 0,
              transition: 'color 0.35s ease',
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
            background: isDarkMode ? '#0b0f16' : '#f8fafc',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '0.8rem',
            color: isDarkMode ? '#8a94a6' : '#475569',
            transition: 'background-color 0.35s ease, border-color 0.35s ease, color 0.35s ease',
          }}
        >
          <Shield size={16} color={isDarkMode ? '#3aa0ff' : '#0082fb'} style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            <strong style={{ color: isDarkMode ? '#f2f5f9' : '#0F172A', transition: 'color 0.35s ease' }}>Role Notice:</strong> Self-registration provisions student learner access. Faculty credentials require departmental assignment.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              backgroundColor: isDarkMode ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.08)',
              color: '#DC2626',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '0.875rem',
              marginBottom: '16px',
              borderLeft: '4px solid #DC2626',
              border: isDarkMode ? '1px solid rgba(220, 38, 38, 0.25)' : '1px solid rgba(220, 38, 38, 0.15)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              transition: 'all 0.35s ease',
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
                  color: isDarkMode ? '#f2f5f9' : '#0F172A',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'color 0.35s ease',
                }}
              >
                First name
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: '0 auto 0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    color: isDarkMode ? '#8a94a6' : '#64748B',
                    transition: 'color 0.35s ease',
                  }}
                >
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
                    backgroundColor: isDarkMode ? '#0b0f16' : '#ffffff',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
                    borderRadius: '8px',
                    color: isDarkMode ? '#f2f5f9' : '#0F172A',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'background-color 0.35s ease, border-color 0.35s ease, color 0.35s ease',
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
                  color: isDarkMode ? '#f2f5f9' : '#0F172A',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'color 0.35s ease',
                }}
              >
                Last name
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: '0 auto 0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    color: isDarkMode ? '#8a94a6' : '#64748B',
                    transition: 'color 0.35s ease',
                  }}
                >
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
                    backgroundColor: isDarkMode ? '#0b0f16' : '#ffffff',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
                    borderRadius: '8px',
                    color: isDarkMode ? '#f2f5f9' : '#0F172A',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'background-color 0.35s ease, border-color 0.35s ease, color 0.35s ease',
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
                color: isDarkMode ? '#f2f5f9' : '#0F172A',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                transition: 'color 0.35s ease',
              }}
            >
              Institutional email address
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: '0 auto 0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  color: isDarkMode ? '#8a94a6' : '#64748B',
                  transition: 'color 0.35s ease',
                }}
              >
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
                  backgroundColor: isDarkMode ? '#0b0f16' : '#ffffff',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
                  borderRadius: '8px',
                  color: isDarkMode ? '#f2f5f9' : '#0F172A',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'background-color 0.35s ease, border-color 0.35s ease, color 0.35s ease',
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
                color: isDarkMode ? '#f2f5f9' : '#0F172A',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                transition: 'color 0.35s ease',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: '0 auto 0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  color: isDarkMode ? '#8a94a6' : '#64748B',
                  transition: 'color 0.35s ease',
                }}
              >
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
                  backgroundColor: isDarkMode ? '#0b0f16' : '#ffffff',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
                  borderRadius: '8px',
                  color: isDarkMode ? '#f2f5f9' : '#0F172A',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  transition: 'background-color 0.35s ease, border-color 0.35s ease, color 0.35s ease',
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
                  color: isDarkMode ? '#8a94a6' : '#64748B',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.35s ease',
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

        <div
          style={{
            marginTop: '16px',
            textAlign: 'center',
            color: isDarkMode ? '#8a94a6' : '#475569',
            fontSize: '0.85rem',
            transition: 'color 0.35s ease',
          }}
        >
          Already registered?{' '}
          <Link
            to="/login"
            style={{
              color: isDarkMode ? '#3aa0ff' : '#0082fb',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'color 0.35s ease',
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

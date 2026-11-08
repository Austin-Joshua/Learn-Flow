import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { LogIn, AlertCircle, KeyRound, Mail, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [highlightPassword, setHighlightPassword] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const { login, isLoading, error, clearError, isAuthenticated, getDefaultDashboardPath } = useAuthStore();
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
        label: 'Staff / Faculty',
        email: import.meta.env.VITE_DEMO_INSTRUCTOR_EMAIL || '',
        password: import.meta.env.VITE_DEMO_INSTRUCTOR_PASSWORD || '',
      },
      {
        role: 'HOD',
        label: 'Head of Dept (HOD)',
        email: import.meta.env.VITE_DEMO_HOD_EMAIL || '',
        password: import.meta.env.VITE_DEMO_HOD_PASSWORD || '',
      },
      {
        role: 'Admin',
        label: 'System Admin',
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
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="w-full"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Institutional Access
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Enter your authorized credentials to access your personalized learning portal
        </p>
      </div>

      {/* Role Quick Selector (When demo personas are enabled) */}
      {isDemoPersonasEnabled && demoPersonas.length > 0 && (
        <div className="mb-6 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-label font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              Role Personas (Evaluation)
            </span>
            <span className="text-meta font-mono text-slate-400 dark:text-slate-500">1-Click Auto-Fill</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {demoPersonas.map((persona) => {
              const isSelected = email === persona.email;
              return (
                <button
                  key={persona.role}
                  type="button"
                  onClick={() => handleSelectPersona(persona.email, persona.password)}
                  className={`relative px-2.5 py-1.5 rounded-md text-xs font-medium border text-center transition-all cursor-pointer ${isSelected
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm ring-2 ring-sky-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500'
                    }`}
                >
                  <div className="font-semibold flex items-center justify-center gap-1">
                    {persona.role}
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white inline" />}
                  </div>
                  <div className="text-meta opacity-75">{persona.label}</div>
                </button>
              );
            })}
          </div>

          {selectedPersona && (
            <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5 text-label">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
                Active: <strong className="text-slate-900 dark:text-white font-semibold">{selectedPersona.role}</strong>
              </span>
              <button
                type="button"
                onClick={() => handleDirectSignIn(selectedPersona.email, selectedPersona.password)}
                disabled={isLoading}
                className="px-2.5 py-1 text-label font-semibold rounded bg-sky-500 hover:bg-sky-600 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                Instant Sign In &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-md p-3.5 flex items-start space-x-2.5 text-rose-800 dark:text-rose-300"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <div className="text-xs font-medium leading-relaxed">{error}</div>
        </motion.div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Email or username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-colors"
              placeholder="e.g. learner@learnflow.edu"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            {highlightPassword && (
              <span className="text-meta font-mono font-medium text-sky-600 dark:text-sky-400">
                Auto-filled & focused
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <KeyRound className="h-4 w-4" />
            </div>
            <input
              ref={passwordInputRef}
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`block w-full pl-9 pr-10 py-2.5 bg-white dark:bg-slate-800/90 border rounded-md text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all font-mono ${highlightPassword
                ? 'border-sky-500 ring-2 ring-sky-500/30 dark:ring-sky-500/40 bg-sky-50/10'
                : 'border-slate-300 dark:border-slate-700 focus:border-sky-600 focus:ring-1 focus:ring-sky-600'
                }`}
              placeholder="••••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 mt-2 flex justify-center items-center px-4 rounded-md text-xs font-semibold text-white bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-600 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Authenticating...</span>
            </span>
          ) : (
            <>
              <LogIn className="w-3.5 h-3.5 mr-2" />
              <span>{selectedPersona ? `Sign In as ${selectedPersona.role}` : 'Sign In to Learnflow'}</span>
            </>
          )}
        </button>
      </form>

      {/* Switch to Register link */}
      <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
        New student to the platform?{' '}
        <Link
          to="/register"
          className="font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 inline-flex items-center space-x-1"
        >
          <span>Create Learner Profile</span>
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </Link>
      </div>
    </motion.div>
  );
};

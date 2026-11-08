import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'instructor' | 'learner' | 'hod' | string | string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, hasRole, getDefaultDashboardPath, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-slate-400">
          <span className="w-3.5 h-3.5 border-2 border-slate-300 dark:border-slate-700 border-t-sky-500 rounded-full animate-spin" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const rolesToCheck = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasAny = rolesToCheck.some((r) => hasRole(r));
    if (!hasAny) {
      const dashboardTarget = getDefaultDashboardPath();
      const userRoleNames = user?.roles.map((r) => r.name).join(', ') || 'none';

      return (
        <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 font-sans transition-colors">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-lg p-6 sm:p-8 shadow-subtle text-left">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-9 h-9 rounded-sm bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                  Access Denied · 403 Forbidden
                </h2>
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                  RBAC Authorization Gate
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              You do not possess the required role credential (<code className="font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded-xs">{rolesToCheck.join(' | ')}</code>) to view this resource.
            </p>

            <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-sm p-3 mb-5 font-mono text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-500">Current principal:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{user?.email || 'authenticated'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-500">Assigned roles:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{userRoleNames}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                to={dashboardTarget}
                className="h-[32px] px-3 rounded-sm text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 inline-flex items-center space-x-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to your workspace</span>
              </Link>
              <Link
                to="/courses"
                className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Browse catalog
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};


import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button, Card } from '../components/ui';
import { FileQuestion, ArrowLeft, Home, LayoutDashboard } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    document.title = 'Learnflow | 404 Page Not Found';
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/';
    const roleNames = user.roles.map((r) => r.name);
    if (roleNames.includes('admin')) return '/admin';
    if (roleNames.includes('hod')) return '/hod';
    if (roleNames.includes('instructor')) return '/instructor/courses';
    return '/my-learning';
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 font-sans">
      <Card className="max-w-md w-full p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-accent-subtle text-accent flex items-center justify-center mx-auto">
          <FileQuestion className="w-6 h-6" />
        </div>
        <div>
          <span className="text-meta font-mono font-bold uppercase tracking-wider text-slate-400">404 Error</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Page Not Found</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            The page you requested does not exist or may have been relocated.
          </p>
        </div>
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isAuthenticated ? (
            <Link to={getDashboardPath()}>
              <Button variant="primary">
                <LayoutDashboard className="w-4 h-4 mr-1.5" />
                <span>Return to Dashboard</span>
              </Button>
            </Link>
          ) : (
            <Link to="/">
              <Button variant="primary">
                <Home className="w-4 h-4 mr-1.5" />
                <span>Return Home</span>
              </Button>
            </Link>
          )}
          <Button variant="secondary" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Go Back</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

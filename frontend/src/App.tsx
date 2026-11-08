import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { ShellRouteWrapper } from './components/layout/ShellRouteWrapper';
import { AuthLayout } from './layouts/AuthLayout';
import { LearnflowCopilot } from './components/ai/LearnflowCopilot';

// Eagerly loaded public entry pages for fast first contentful paint
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Code-split dynamic routes for role dashboards & deep workspaces
const CourseCatalogPage = lazy(() => import('./pages/CourseCatalogPage').then(m => ({ default: m.CourseCatalogPage })));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage').then(m => ({ default: m.CourseDetailPage })));
const LessonPlayerPage = lazy(() => import('./pages/LessonPlayerPage').then(m => ({ default: m.LessonPlayerPage })));
const AssessmentArenaPage = lazy(() => import('./pages/AssessmentArenaPage').then(m => ({ default: m.AssessmentArenaPage })));
const AssessmentResultPage = lazy(() => import('./pages/AssessmentResultPage').then(m => ({ default: m.AssessmentResultPage })));
const MyLearningPage = lazy(() => import('./pages/MyLearningPage').then(m => ({ default: m.MyLearningPage })));
const MyJourneyPage = lazy(() => import('./pages/MyJourneyPage').then(m => ({ default: m.MyJourneyPage })));
const LearnerCertificatesPage = lazy(() => import('./pages/LearnerCertificatesPage').then(m => ({ default: m.LearnerCertificatesPage })));
const AdaptiveRecommendationsPage = lazy(() => import('./pages/AdaptiveRecommendationsPage').then(m => ({ default: m.AdaptiveRecommendationsPage })));
const PublicVerifyCertificatePage = lazy(() => import('./pages/PublicVerifyCertificatePage').then(m => ({ default: m.PublicVerifyCertificatePage })));
const InstructorDashboardPage = lazy(() => import('./pages/InstructorDashboardPage').then(m => ({ default: m.InstructorDashboardPage })));
const CourseBuilderPage = lazy(() => import('./pages/CourseBuilderPage').then(m => ({ default: m.CourseBuilderPage })));
const AssignmentGradingQueuePage = lazy(() => import('./pages/AssignmentGradingQueuePage').then(m => ({ default: m.AssignmentGradingQueuePage })));
const CohortAnalyticsPage = lazy(() => import('./pages/CohortAnalyticsPage').then(m => ({ default: m.CohortAnalyticsPage })));
const HODDashboardPage = lazy(() => import('./pages/HODDashboardPage').then(m => ({ default: m.HODDashboardPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

interface WorkspaceProps {
  requiredRole?: string | string[];
  children: React.ReactNode;
}

const Workspace: React.FC<WorkspaceProps> = ({ requiredRole, children }) => (
  <ProtectedRoute requiredRole={requiredRole}>
    <AppShell>{children}</AppShell>
  </ProtectedRoute>
);

const WorkspaceFallback: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-slate-400">
      <span className="w-3.5 h-3.5 border-2 border-slate-300 dark:border-slate-700 border-t-sky-500 rounded-full animate-spin" />
      <span>Loading workspace...</span>
    </div>
  </div>
);

// Copilot is strictly for signed-in work areas only: never on public pages, never on auth pages,
// never inside live lessons (to support deep reading focus), and never inside a live assessment.
export const CopilotGate: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { pathname } = useLocation();
  const hidden =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/verify') ||
    pathname.startsWith('/lessons/') ||
    pathname.startsWith('/assessments/');
  return isAuthenticated && !hidden ? <LearnflowCopilot /> : null;
};

export const App: React.FC = () => {
  const { loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
          <main className="flex-1">
            <Suspense fallback={<WorkspaceFallback />}>
              <Routes>
                {/* 1. Public Landing Page with Rich Showcase Sections */}
                <Route path="/" element={<LandingPage />} />

                {/* 2. Public / Adaptive Curricula & Verification Routes */}
                <Route element={<ShellRouteWrapper />}>
                  <Route path="/courses" element={<CourseCatalogPage />} />
                  <Route path="/courses/:id" element={<CourseDetailPage />} />
                  <Route path="/verify" element={<PublicVerifyCertificatePage />} />
                  <Route path="/verify/:code" element={<PublicVerifyCertificatePage />} />
                </Route>

                {/* 3. Auth Split-Screen Routes */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                </Route>

                {/* 4. Learner Protected Routes (inside AppShell) */}
                <Route
                  path="/my-learning"
                  element={
                    <Workspace requiredRole="learner">
                      <MyLearningPage />
                    </Workspace>
                  }
                />
                <Route
                  path="/my-journey"
                  element={
                    <Workspace requiredRole="learner">
                      <MyJourneyPage />
                    </Workspace>
                  }
                />
                <Route
                  path="/lessons/:id"
                  element={
                    <Workspace>
                      <LessonPlayerPage />
                    </Workspace>
                  }
                />
                <Route
                  path="/assessments/:id"
                  element={
                    <Workspace requiredRole="learner">
                      <AssessmentArenaPage />
                    </Workspace>
                  }
                />
                <Route
                  path="/attempts/:id/result"
                  element={
                    <Workspace>
                      <AssessmentResultPage />
                    </Workspace>
                  }
                />
                <Route
                  path="/my-certificates"
                  element={
                    <Workspace requiredRole="learner">
                      <LearnerCertificatesPage />
                    </Workspace>
                  }
                />
                <Route
                  path="/adaptive-path"
                  element={
                    <Workspace requiredRole="learner">
                      <AdaptiveRecommendationsPage />
                    </Workspace>
                  }
                />

                {/* 5. Instructor / Staff Protected Routes */}
                <Route
                  path="/instructor/courses"
                  element={
                    <Workspace requiredRole={['instructor', 'admin']}>
                      <InstructorDashboardPage />
                    </Workspace>
                  }
                />
                <Route
                  path="/instructor/courses/:id/builder"
                  element={
                    <Workspace requiredRole={['instructor', 'admin']}>
                      <CourseBuilderPage />
                    </Workspace>
                  }
                />
                <Route
                  path="/instructor/grading"
                  element={
                    <Workspace requiredRole={['instructor', 'admin']}>
                      <AssignmentGradingQueuePage />
                    </Workspace>
                  }
                />
                <Route
                  path="/instructor/courses/:id/analytics"
                  element={
                    <Workspace requiredRole={['instructor', 'admin']}>
                      <CohortAnalyticsPage />
                    </Workspace>
                  }
                />

                {/* 6. HOD (Head of Department) Protected Routes */}
                <Route
                  path="/hod"
                  element={
                    <Workspace requiredRole={['hod', 'admin']}>
                      <HODDashboardPage />
                    </Workspace>
                  }
                />

                {/* 7. Admin Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <Workspace requiredRole="admin">
                      <AdminDashboardPage />
                    </Workspace>
                  }
                />

                {/* 8. Fallback Catch-All */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>

          <CopilotGate />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;

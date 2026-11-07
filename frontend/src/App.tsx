import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthLayout } from './layouts/AuthLayout';
import { LearnflowCopilot } from './components/ai/LearnflowCopilot';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CourseCatalogPage } from './pages/CourseCatalogPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { LessonPlayerPage } from './pages/LessonPlayerPage';
import { AssessmentArenaPage } from './pages/AssessmentArenaPage';
import { AssessmentResultPage } from './pages/AssessmentResultPage';
import { MyLearningPage } from './pages/MyLearningPage';
import { LearnerCertificatesPage } from './pages/LearnerCertificatesPage';
import { AdaptiveRecommendationsPage } from './pages/AdaptiveRecommendationsPage';
import { PublicVerifyCertificatePage } from './pages/PublicVerifyCertificatePage';
import { InstructorDashboardPage } from './pages/InstructorDashboardPage';
import { CourseBuilderPage } from './pages/CourseBuilderPage';
import { AssignmentGradingQueuePage } from './pages/AssignmentGradingQueuePage';
import { CohortAnalyticsPage } from './pages/CohortAnalyticsPage';
import { HODDashboardPage } from './pages/HODDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

// Copilot is for signed-in work areas only: never on public pages, and never inside a live assessment.
const CopilotGate: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { pathname } = useLocation();
  const hidden = pathname === '/' || pathname.startsWith('/verify') || pathname.startsWith('/assessments/');
  return isAuthenticated && !hidden ? <LearnflowCopilot /> : null;
};

export const App: React.FC = () => {
  const { loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/courses" element={<CourseCatalogPage />} />
              <Route path="/courses/:id" element={<CourseDetailPage />} />
              <Route path="/verify" element={<PublicVerifyCertificatePage />} />
              <Route path="/verify/:code" element={<PublicVerifyCertificatePage />} />

              {/* Animated Auth Split-Screen Routes (RIT-Digital-Twin style transition) */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Learner Protected Routes */}
              <Route
                path="/my-learning"
                element={
                  <ProtectedRoute requiredRole="learner">
                    <MyLearningPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lessons/:id"
                element={
                  <ProtectedRoute>
                    <LessonPlayerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assessments/:id"
                element={
                  <ProtectedRoute requiredRole="learner">
                    <AssessmentArenaPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attempts/:id/result"
                element={
                  <ProtectedRoute>
                    <AssessmentResultPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-certificates"
                element={
                  <ProtectedRoute requiredRole="learner">
                    <LearnerCertificatesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/adaptive-path"
                element={
                  <ProtectedRoute requiredRole="learner">
                    <AdaptiveRecommendationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Instructor / Staff Protected Routes */}
              <Route
                path="/instructor/courses"
                element={
                  <ProtectedRoute requiredRole="instructor">
                    <InstructorDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/instructor/courses/:id/builder"
                element={
                  <ProtectedRoute requiredRole="instructor">
                    <CourseBuilderPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/instructor/grading"
                element={
                  <ProtectedRoute requiredRole="instructor">
                    <AssignmentGradingQueuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/instructor/courses/:id/analytics"
                element={
                  <ProtectedRoute requiredRole="instructor">
                    <CohortAnalyticsPage />
                  </ProtectedRoute>
                }
              />

              {/* HOD (Head of Department) Protected Routes */}
              <Route
                path="/hod"
                element={
                  <ProtectedRoute requiredRole={['hod', 'admin']}>
                    <HODDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/courses" replace />} />
            </Routes>
          </main>

          <CopilotGate />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;

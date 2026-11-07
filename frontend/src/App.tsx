import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
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
import { AdminDashboardPage } from './pages/AdminDashboardPage';

export const App: React.FC = () => {
  const { loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/courses" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/courses" element={<CourseCatalogPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route path="/verify" element={<PublicVerifyCertificatePage />} />
            <Route path="/verify/:code" element={<PublicVerifyCertificatePage />} />

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

            {/* Instructor / Admin Protected Routes */}
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
      </div>
    </BrowserRouter>
  );
};

export default App;

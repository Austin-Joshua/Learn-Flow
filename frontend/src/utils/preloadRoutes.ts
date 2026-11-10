/**
 * Preloads code-split route chunks during idle and initial cycles.
 * Prevents chunk network stalls during page transitions and eliminates routing lag.
 */

export function preloadWorkspaceRoutes(): void {
  if (typeof window === 'undefined') return;

  const prefetchCore = () => {
    // High-priority core learner & catalog routes
    import('../pages/MyLearningPage');
    import('../pages/MyJourneyPage');
    import('../pages/CourseCatalogPage');
    import('../pages/CourseDetailPage');
    import('../pages/AvatarStudioPage');
    import('../pages/SettingsPage');
    import('../pages/LearnerCertificatesPage');
    import('../pages/AdaptiveRecommendationsPage');
  };

  const prefetchAdminAndStaff = () => {
    // Faculty, studio, and governance workspaces
    import('../pages/InstructorDashboardPage');
    import('../pages/CourseBuilderPage');
    import('../pages/CohortAnalyticsPage');
    import('../pages/AssignmentGradingQueuePage');
    import('../pages/AdminDashboardPage');
    import('../pages/LessonPlayerPage');
    import('../pages/AssessmentArenaPage');
    import('../pages/AssessmentResultPage');
    import('../pages/PublicVerifyCertificatePage');
  };

  // Immediate micro-task warm up for core pages
  setTimeout(prefetchCore, 60);

  // Secondary idle cycle for deep studio and grading workspaces
  if ('requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(
      prefetchAdminAndStaff
    );
  } else {
    setTimeout(prefetchAdminAndStaff, 250);
  }
}

export default preloadWorkspaceRoutes;

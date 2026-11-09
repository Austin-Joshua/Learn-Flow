/**
 * Preloads code-split route chunks during idle browser cycles.
 * Prevents chunk network stalls during page transitions.
 */

export function preloadWorkspaceRoutes(): void {
  if (typeof window === 'undefined') return;

  const prefetch = () => {
    // High-priority core learner & catalog routes
    import('../pages/MyLearningPage');
    import('../pages/MyJourneyPage');
    import('../pages/CourseCatalogPage');
    import('../pages/SettingsPage');
    import('../pages/LearnerCertificatesPage');
    import('../pages/AdaptiveRecommendationsPage');

    // Administrative & Instructor studios
    import('../pages/InstructorDashboardPage');
    import('../pages/HODDashboardPage');
    import('../pages/AdminDashboardPage');
    import('../pages/CourseDetailPage');
  };

  if ('requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(prefetch);
  } else {
    setTimeout(prefetch, 150);
  }
}

export default preloadWorkspaceRoutes;


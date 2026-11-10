/**
 * Course URL & Canonical Slug Routing Utility
 * Generates clean, human-readable, semantic URLs for all computing courses.
 */

export interface CourseUrlTarget {
  id?: string;
  slug?: string;
  title?: string;
}

/**
 * Returns the primary clean identifier (slug preferred, fallback to id).
 */
export function getCourseSlugOrId(course?: CourseUrlTarget | string | null): string {
  if (!course) return '';
  if (typeof course === 'string') return course;
  return course.slug || course.id || '';
}

/**
 * Generates the clean syllabus/detail URL: /courses/:slug
 */
export function getCourseDetailUrl(course?: CourseUrlTarget | string | null): string {
  const target = getCourseSlugOrId(course);
  return target ? `/courses/${encodeURIComponent(target)}` : '/courses';
}

/**
 * Generates clean instructor curriculum builder URL: /instructor/courses/:slug/builder
 */
export function getCourseBuilderUrl(course?: CourseUrlTarget | string | null): string {
  const target = getCourseSlugOrId(course);
  return target ? `/instructor/courses/${encodeURIComponent(target)}/builder` : '/instructor/courses';
}

/**
 * Generates clean instructor analytics URL: /instructor/courses/:slug/analytics
 */
export function getCourseAnalyticsUrl(course?: CourseUrlTarget | string | null): string {
  const target = getCourseSlugOrId(course);
  return target ? `/instructor/courses/${encodeURIComponent(target)}/analytics` : '/instructor/courses';
}


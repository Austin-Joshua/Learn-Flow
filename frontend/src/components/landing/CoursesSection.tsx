import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, ArrowRight } from 'lucide-react';

export interface FeaturedCourse {
  id: string;
  title: string;
  difficulty: string;
  modules: number;
  lessons: number;
  instructor: string;
  description: string;
  concepts: string[];
}

interface CoursesSectionProps {
  courses: FeaturedCourse[];
}

export const CoursesSection: React.FC<CoursesSectionProps> = ({ courses }) => {
  return (
    <section id="courses" className="py-20 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium mb-3">
              <BookOpen className="w-3.5 h-3.5 text-sky-500" />
              <span>Curated Computing Curricula</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Four Foundational Computer Science Tracks
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-xl">
              Every curriculum provides comprehensive theoretical rigor, verified code labs, and sequential assessment checkpoints.
            </p>
          </div>

          <Link
            to="/courses"
            className="mt-4 md:mt-0 inline-flex items-center space-x-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors"
          >
            <span>View Full Course Catalog</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-meta font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider">
                    {course.difficulty}
                  </span>
                  <span className="text-label font-mono text-slate-500">
                    {course.modules} Modules &bull; {course.lessons} Lessons
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight line-clamp-2 mb-2">
                  {course.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 mb-4 font-normal">
                  {course.description}
                </p>
              </div>

              <div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {course.concepts.map((concept) => (
                    <span
                      key={concept}
                      className="text-meta font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300"
                    >
                      {concept}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate">{course.instructor}</span>
                  <Link
                    to="/login"
                    className="font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center space-x-1"
                  >
                    <span>Enroll</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

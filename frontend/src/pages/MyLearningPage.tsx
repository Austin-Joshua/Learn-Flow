import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Course } from '../types';
import { ProgressRing } from '../components/common/ProgressRing';
import { AdaptiveGrid } from '../components/common/AdaptiveGrid';
import {
  BookOpen,
  PlayCircle,
  ArrowRight,
  Compass,
  Award,
} from 'lucide-react';

export const MyLearningPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      setIsLoading(true);
      try {
        const res = await api.enrollments.myCourses();
        setCourses(res.data);
      } catch (err) {
        console.error('Failed to load my courses', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyCourses();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Enrolled Courses
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Continue your progress across your active curriculum tracks.
          </p>
        </div>

        {courses.length > 0 && (
          <Link
            to="/my-journey"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100/80 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-lg text-xs font-semibold transition-colors self-start sm:self-auto"
          >
            <Compass className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Interactive Mountain Journey</span>
          </Link>
        )}
      </div>

      {isLoading ? (
        <AdaptiveGrid variant="normal">
          {[1, 2].map((n) => (
            <div key={n} className="h-64 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
          ))}
        </AdaptiveGrid>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 max-w-xl mx-auto shadow-xs">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No active enrollments</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            Explore our curriculum catalog to find courses matching your skill path.
          </p>
          <Link
            to="/courses"
            className="h-10 px-5 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-semibold shadow-xs transition-colors inline-flex items-center"
          >
            Browse Course Catalog
          </Link>
        </div>
      ) : (
        <AdaptiveGrid variant="normal">
          {courses.map((course) => {
            const pct = Math.round(course.progress_percentage || 0);
            return (
              <div
                key={course.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded border border-sky-100 dark:border-sky-900/60 inline-block mb-2">
                        {course.difficulty}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                        {course.title}
                      </h3>
                    </div>

                    <div className="shrink-0">
                      <ProgressRing
                        value={pct}
                        size={56}
                        strokeWidth={5}
                        label={`${course.title} progress`}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Link
                    to={`/courses/${course.id}`}
                    className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center space-x-1"
                  >
                    <span>{pct === 100 ? 'Review Syllabus' : 'Open Syllabus'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    to={pct === 100 ? '/my-certificates' : `/courses/${course.id}`}
                    className={`h-8 px-3.5 rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer ${
                      pct === 100
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white'
                    }`}
                  >
                    {pct === 100 ? (
                      <>
                        <Award className="w-3.5 h-3.5 text-amber-200" />
                        <span>View Certificate</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Continue</span>
                      </>
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </AdaptiveGrid>
      )}
    </div>
  );
};

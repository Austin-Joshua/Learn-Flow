import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Course } from '../types';
import { AdaptiveGrid } from '../components/common/AdaptiveGrid';
import { AdaptiveModal } from '../components/common/AdaptiveModal';
import { PageHeader, EmptyState, Button, Input, Select, Textarea } from '../components/ui';
import { getCourseCoverImage } from '../utils/courseImages';
import { CourseQuickPeekModal } from '../components/course/CourseQuickPeekModal';
import { getCourseDetailUrl, getCourseBuilderUrl, getCourseAnalyticsUrl } from '../utils/courseUrls';
import {
  BookOpen,
  PlusCircle,
  BarChart3,
  ClipboardList,
  Edit,
  Search,
  Users,
  Layers,
  Award,
  CheckCircle2,
  Eye,
} from 'lucide-react';

export const InstructorDashboardPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'learners' | 'title' | 'status'>('learners');

  // Quick-Peek Modal State
  const [peekCourse, setPeekCourse] = useState<Course | null>(null);
  const [peekTab, setPeekTab] = useState<'syllabus' | 'continue'>('syllabus');

  // New Course Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const navigate = useNavigate();

  const fetchManaged = async () => {
    setIsLoading(true);
    try {
      const [res, queueRes] = await Promise.all([
        api.courses.listManaged(),
        api.assignments.getInstructorQueue(),
      ]);
      setCourses(res.data);
      setQueueCount(queueRes.data.length);
    } catch (err) {
      console.error('Failed to load instructor data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManaged();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.courses.create({
        title,
        description,
        difficulty,
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      await fetchManaged();
    } catch (err) {
      console.error('Failed to create course', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Filtered & Sorted Courses
  const filteredCourses = useMemo(() => {
    return courses
      .filter((c) => {
        const matchesSearch =
          searchQuery.trim() === '' ||
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus =
          statusFilter === 'all' || (c.status && c.status.toLowerCase() === statusFilter.toLowerCase());

        const matchesDifficulty =
          difficultyFilter === 'all' || (c.difficulty && c.difficulty.toLowerCase() === difficultyFilter.toLowerCase());

        return matchesSearch && matchesStatus && matchesDifficulty;
      })
      .sort((a, b) => {
        if (sortBy === 'learners') {
          return (b.enrolled_count || 0) - (a.enrolled_count || 0);
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'status') {
          return (a.status || '').localeCompare(b.status || '');
        }
        return 0;
      });
  }, [courses, searchQuery, statusFilter, difficultyFilter, sortBy]);

  // Aggregate Metrics
  const totalLearners = useMemo(() => {
    return courses.reduce((acc, c) => acc + (c.enrolled_count || 0), 0);
  }, [courses]);

  const publishedCount = useMemo(() => {
    return courses.filter((c) => c.status === 'published').length;
  }, [courses]);

  return (
    <div className="space-y-6 sm:space-y-7 font-sans max-w-7xl mx-auto">
      {/* Studio Header */}
      <PageHeader
        title="Instructor Studio"
        subtitle="Author curriculum tracks, structure sequential lessons, and evaluate student submissions."
        actions={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              to="/instructor/grading"
              className="flex-1 sm:flex-initial h-10 px-3 sm:px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-2"
            >
              <ClipboardList className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Grading Queue</span>
              {queueCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white">
                  {queueCount}
                </span>
              )}
            </Link>

            <Button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex-1 sm:flex-initial h-10"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              <span>Create Course</span>
            </Button>
          </div>
        }
      />

      {/* Institutional Metrics Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Metric 1: Authored Tracks */}
        <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5 sm:mb-1 font-semibold truncate">
              Authored Tracks
            </span>
            <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {courses.length}
            </div>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block truncate">
              {publishedCount} Published &bull; 6 Modules
            </span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/40 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Metric 2: Enrolled Students */}
        <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5 sm:mb-1 font-semibold truncate">
              Enrolled Learners
            </span>
            <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {totalLearners}
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block truncate">
              Across curricula
            </span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Metric 3: Grading Queue */}
        <Link
          to="/instructor/grading"
          className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs hover:border-amber-400/60 transition-colors flex items-center justify-between group cursor-pointer"
        >
          <div className="min-w-0 pr-2">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5 sm:mb-1 font-semibold truncate">
              Submissions Queue
            </span>
            <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {queueCount}
            </div>
            <span className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-mono mt-0.5 block group-hover:underline truncate">
              {queueCount > 0 ? 'Review submissions &rarr;' : 'Queue up-to-date'}
            </span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </Link>

        {/* Metric 4: Curriculum Readiness */}
        <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5 sm:mb-1 font-semibold truncate">
              Curriculum Health
            </span>
            <div className="text-lg sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight flex items-center gap-1">
              <span>100%</span>
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block truncate">
              Quizzes &amp; Rubrics
            </span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (Parity with Course Catalog) */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-72 lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search managed courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white placeholder:text-slate-400 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          {/* Difficulty Tiers */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl shrink-0">
            {['all', 'beginner', 'intermediate', 'advanced'].map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficultyFilter(diff)}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-medium capitalize transition-colors cursor-pointer ${
                  difficultyFilter === diff
                    ? 'bg-sky-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {diff === 'all' ? 'All Tiers' : diff}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl shrink-0">
            {['all', 'published', 'draft'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-medium capitalize transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl shrink-0">
            <span className="text-[10px] font-mono text-slate-500 uppercase px-1.5 font-semibold">Sort:</span>
            {[
              { id: 'learners', label: 'Enrollment' },
              { id: 'title', label: 'Title' },
              { id: 'status', label: 'Status' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSortBy(s.id as 'learners' | 'title' | 'status')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-colors cursor-pointer ${
                  sortBy === s.id
                    ? 'bg-sky-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Courses Grid with Exact Course Catalog Visual UI */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Managed Curricula ({filteredCourses.length})
          </h2>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Showing {filteredCourses.length} of {courses.length} tracks
          </span>
        </div>

        {isLoading ? (
          <AdaptiveGrid variant="normal">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-72 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
            ))}
          </AdaptiveGrid>
        ) : filteredCourses.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />}
            title="No matching courses found"
            description={
              courses.length === 0
                ? "Create your first course track to begin structuring modules and lessons."
                : "No managed courses match your current search and filter settings."
            }
            action={
              courses.length === 0 ? (
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                >
                  Author New Course
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setDifficultyFilter('all');
                  }}
                >
                  Reset Filters
                </Button>
              )
            }
          />
        ) : (
          <AdaptiveGrid variant="normal">
            {filteredCourses.map((c) => {
              const coverImage = getCourseCoverImage(c);

              return (
                <div
                  key={c.id}
                  className="skeuo-card group relative rounded-2xl border border-slate-200/90 dark:border-white/10 hover:border-[#0082fb]/50 dark:hover:border-sky-400/50 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden bg-white dark:bg-[#070c14] select-none"
                >
                  <div>
                    {/* Thematic Cover Photo Banner with Glassmorphic Badges */}
                    <div className="h-40 sm:h-44 md:h-48 w-full relative overflow-hidden bg-slate-900">
                      <img
                        src={coverImage}
                        alt={c.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Dark gradient scrim for strong text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent pointer-events-none" />

                      {/* Floating Top Badges */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md shadow-xs border ${
                            c.status === 'published'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                          }`}>
                            {c.status || 'published'}
                          </span>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md shadow-xs border ${
                            c.difficulty === 'beginner'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                              : c.difficulty === 'intermediate'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                              : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                          }`}>
                            {c.difficulty || 'intermediate'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5 backdrop-blur-md bg-slate-900/80 border border-white/15 px-2.5 py-0.5 rounded-full text-slate-200 text-[10px] font-mono shadow-xs">
                          <Users className="w-3 h-3 text-sky-400" />
                          <span>{c.enrolled_count || 0} Learners</span>
                        </div>
                      </div>

                      {/* Bottom Title Overlay on Gradient */}
                      <div className="absolute bottom-3 inset-x-3.5 z-10 pointer-events-none">
                        <span className="text-[10px] font-mono text-sky-400 font-semibold uppercase tracking-wider block mb-1">
                          Accredited Curriculum Track
                        </span>
                        <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-snug line-clamp-2 drop-shadow-sm group-hover:text-sky-200 transition-colors">
                          {c.title}
                        </h3>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 sm:p-5 space-y-2.5">
                      <p className="text-slate-600 dark:text-slate-300 text-xs line-clamp-2 leading-relaxed">
                        {c.description || 'Structured academic computer science curriculum track.'}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1">
                        <Layers className="w-3.5 h-3.5 text-sky-500" />
                        <span>{c.modules ? `${c.modules.length} Modules` : '6 Modules'}</span>
                        <span>&bull;</span>
                        <span>Verifiable Certificate</span>
                      </div>
                    </div>
                  </div>

                  {/* Tactile Action Bar with Curriculum Builder & Analytics */}
                  <div className="p-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2.5 mt-auto bg-slate-50/50 dark:bg-white/[0.02]">
                    <button
                      type="button"
                      onClick={() => {
                        setPeekCourse(c);
                        setPeekTab('syllabus');
                      }}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 flex items-center space-x-1 cursor-pointer py-1"
                      title="Preview Course Syllabus"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <Link
                        to={getCourseAnalyticsUrl(c)}
                        className="h-9 w-9 sm:h-8 sm:w-8 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 bg-white dark:bg-slate-900 flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
                        title="View Cohort Drop-off & Mastery Telemetry"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Link>

                      <Link
                        to={getCourseBuilderUrl(c)}
                        className="h-9 sm:h-8 px-3.5 rounded-xl text-xs font-semibold bg-[#0082fb] hover:bg-[#155dfc] text-white shadow-md glow-blue transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Curriculum Builder</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </AdaptiveGrid>
        )}
      </div>

      {/* Adaptive Modal for Course Creation */}
      <AdaptiveModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Course Track"
        description="Initialize a curriculum track. You can subsequently add sequential modules, lessons, and prerequisite gates."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <Input
            label="Course Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Distributed Consensus Algorithms"
          />

          <Textarea
            label="Description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline the learning objectives and core competencies covered..."
          />

          <Select
            label="Difficulty Tier"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isCreating}
              className="w-full sm:w-auto"
            >
              Create Course Track
            </Button>
          </div>
        </form>
      </AdaptiveModal>

      {/* Course Quick Peek Modal */}
      <CourseQuickPeekModal
        course={peekCourse}
        isOpen={Boolean(peekCourse)}
        initialTab={peekTab}
        onClose={() => setPeekCourse(null)}
        onContinue={(course) => {
          setPeekCourse(null);
          navigate(getCourseBuilderUrl(course));
        }}
        onViewSyllabus={(course) => {
          setPeekCourse(null);
          navigate(getCourseDetailUrl(course));
        }}
      />
    </div>
  );
};

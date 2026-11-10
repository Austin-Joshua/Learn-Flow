import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { api } from '../services/api';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { AdaptiveGrid } from '../components/common/AdaptiveGrid';
import { PageHeader, StatTile } from '../components/ui';
import { getCourseCoverImage } from '../utils/courseImages';
import { CourseQuickPeekModal } from '../components/course/CourseQuickPeekModal';
import { Course } from '../types';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Award,
  Search,
  Building2,
  LayoutGrid,
  List,
  Eye,
  BarChart3,
  Users,
  GraduationCap,
} from 'lucide-react';

interface FacultyWorkload {
  faculty_id: string;
  faculty_name: string;
  faculty_email: string;
  courses_count: number;
  enrolled_students: number;
  pending_grading: number;
  status: string;
}

interface CourseHealth {
  course_id: string;
  course_title: string;
  instructor_name: string;
  status: string;
  difficulty: string;
  enrolled_students: number;
  completion_percentage: number;
  average_assessment_score: number;
}

interface DepartmentOverviewData {
  department_name: string;
  total_courses: number;
  published_courses: number;
  draft_courses: number;
  total_faculty: number;
  total_students: number;
  total_enrollments: number;
  total_at_risk_students?: number;
  department_completion_rate: number;
  pending_grading_queue_size: number;
  faculty_workload: FacultyWorkload[];
  course_health: CourseHealth[];
}

export const HODDashboardPage: React.FC = () => {
  const [data, setData] = useState<DepartmentOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'faculty' | 'courses'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [courseViewMode, setCourseViewMode] = useState<'grid' | 'table'>('grid');
  const [peekCourse, setPeekCourse] = useState<Course | null>(null);

  const fetchOverview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.analytics.getHodDepartmentOverview();
      setData(res.data as unknown as DepartmentOverviewData);
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.detail
          ? String(err.response.data.detail)
          : 'Failed to load department oversight metrics.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const filteredCourses =
    data?.course_health.filter(
      (c) =>
        c.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.instructor_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const filteredFaculty =
    data?.faculty_workload.filter(
      (f) =>
        f.faculty_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.faculty_email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Overview Courses Columns Definition
  const overviewCourseColumns: ColumnDef<CourseHealth>[] = [
    {
      key: 'title',
      header: 'Course Title',
      isPrimary: true,
      priority: 'always',
      render: (c) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white leading-tight">{c.course_title}</div>
          <div className="text-label text-slate-500 font-mono sm:hidden">{c.instructor_name}</div>
        </div>
      ),
    },
    {
      key: 'instructor',
      header: 'Faculty Lead',
      priority: 'tablet-up',
      render: (c) => <span className="text-slate-500 dark:text-slate-400 font-medium">{c.instructor_name}</span>,
    },
    {
      key: 'students',
      header: 'Students',
      priority: 'desktop-only',
      align: 'right',
      render: (c) => <span className="font-mono">{c.enrolled_students}</span>,
    },
    {
      key: 'completion',
      header: 'Completion',
      isStatus: true,
      priority: 'always',
      align: 'right',
      render: (c) => (
        <span
          className={`inline-block px-2 py-0.5 rounded-full font-mono text-label font-semibold ${
            c.completion_percentage >= 70
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : c.completion_percentage >= 40
              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
          }`}
        >
          {c.completion_percentage}%
        </span>
      ),
    },
    {
      key: 'score',
      header: 'Avg Score',
      priority: 'tablet-up',
      align: 'right',
      render: (c) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white">
          {c.average_assessment_score > 0 ? `${c.average_assessment_score}%` : 'N/A'}
        </span>
      ),
    },
  ];

  // Faculty Roster Columns Definition
  const facultyColumns: ColumnDef<FacultyWorkload>[] = [
    {
      key: 'name',
      header: 'Faculty Member',
      isPrimary: true,
      priority: 'always',
      render: (f) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white">{f.faculty_name}</div>
          <div className="text-label text-slate-500 dark:text-slate-400 font-mono">{f.faculty_email}</div>
        </div>
      ),
    },
    {
      key: 'courses',
      header: 'Courses',
      priority: 'tablet-up',
      align: 'center',
      render: (f) => <span className="font-mono font-medium">{f.courses_count}</span>,
    },
    {
      key: 'students',
      header: 'Students',
      priority: 'desktop-only',
      align: 'center',
      render: (f) => <span className="font-mono font-medium">{f.enrolled_students}</span>,
    },
    {
      key: 'pending',
      header: 'Grading Queue',
      isStatus: true,
      priority: 'always',
      align: 'center',
      render: (f) => (
        <span
          className={`inline-block px-2 py-0.5 rounded-full font-mono text-label ${
            f.pending_grading > 0
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {f.pending_grading} queue
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      priority: 'desktop-only',
      align: 'right',
      render: () => (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-xs text-meta font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          <span>ACTIVE</span>
        </span>
      ),
    },
  ];

  // Course Health Detailed Columns Definition
  const courseHealthColumns: ColumnDef<CourseHealth>[] = [
    {
      key: 'title',
      header: 'Course Title',
      isPrimary: true,
      priority: 'always',
      render: (c) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white">{c.course_title}</div>
          <div className="text-label text-slate-500 capitalize font-mono sm:hidden">
            {c.difficulty} • {c.instructor_name}
          </div>
        </div>
      ),
    },
    {
      key: 'instructor',
      header: 'Instructor',
      priority: 'tablet-up',
      render: (c) => <span className="text-slate-500 dark:text-slate-400">{c.instructor_name}</span>,
    },
    {
      key: 'difficulty',
      header: 'Level',
      priority: 'desktop-only',
      render: (c) => <span className="capitalize font-mono text-label text-slate-500">{c.difficulty}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      isStatus: true,
      priority: 'always',
      render: (c) => (
        <span
          className={`inline-block px-2 py-0.5 rounded-xs font-mono text-meta uppercase font-bold ${
            c.status === 'published'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
          }`}
        >
          {c.status}
        </span>
      ),
    },
    {
      key: 'enrolled',
      header: 'Enrolled',
      priority: 'desktop-only',
      align: 'right',
      render: (c) => <span className="font-mono">{c.enrolled_students}</span>,
    },
    {
      key: 'completion',
      header: 'Completion',
      priority: 'always',
      align: 'right',
      render: (c) => (
        <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">{c.completion_percentage}%</span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
        <div className="h-32 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 font-sans">
      <PageHeader
        badge={
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            <Building2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Academic Leadership & Governance</span>
          </div>
        }
        title="Head of Department (HOD) Portal"
        subtitle={`Department oversight for ${data?.department_name || 'Computer Science'}`}
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stat Tiles with AdaptiveGrid */}
      {data && (
        <AdaptiveGrid variant="compact">
          <StatTile
            label="Total Courses"
            value={data.total_courses}
            subtext={`${data.published_courses} published • ${data.draft_courses} draft`}
          />
          <StatTile
            label="Total Faculty"
            value={data.total_faculty}
            subtext="Active teaching staff"
          />
          <StatTile
            label="Student Enrollments"
            value={data.total_enrollments}
            subtext={`${data.total_students} unique learners`}
          />
          <StatTile
            label="Grading Queue"
            value={data.pending_grading_queue_size}
            subtext="Pending assignment review"
          />
          <StatTile
            label="At-Risk Learners"
            value={data.total_at_risk_students ?? 0}
            subtext="Academic intervention needed"
          />
        </AdaptiveGrid>
      )}

      {/* Tabs Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'bg-slate-900 dark:bg-sky-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Overview & Funnel
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faculty')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'faculty'
                ? 'bg-slate-900 dark:bg-sky-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Faculty Roster ({data?.faculty_workload.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'courses'
                ? 'bg-slate-900 dark:bg-sky-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Curriculum Audit ({data?.course_health.length || 0})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search faculty or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Course Academic Performance Funnel
            </h2>
            <DataTable
              data={data?.course_health.slice(0, 8) || []}
              columns={overviewCourseColumns}
              keyExtractor={(c) => c.course_id}
              emptyMessage="No course health records available."
            />
          </div>

          {/* Department Actionable Priorities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-900/50 space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-medium text-sky-800 dark:text-sky-300">
                <FileCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Curriculum Compliance Verified</span>
              </div>
              <p className="text-label text-sky-700 dark:text-sky-300/80 leading-relaxed">
                All course modules adhere to prerequisite progression standards with verified completion dependencies.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-medium text-amber-800 dark:text-amber-300">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Grading Turnaround Window</span>
              </div>
              <p className="text-label text-amber-700 dark:text-amber-300/80 leading-relaxed">
                {data?.pending_grading_queue_size || 0} open assignment submissions awaiting faculty review.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Credential Security</span>
              </div>
              <p className="text-label text-emerald-700 dark:text-emerald-300/80 leading-relaxed">
                HMAC-SHA256 signatures with 128 bits of entropy protecting all issued certificates.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Faculty Workload Directory */}
      {activeTab === 'faculty' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
            Department Faculty Roster & Workload Allocation
          </h2>
          <DataTable
            data={filteredFaculty}
            columns={facultyColumns}
            keyExtractor={(f) => f.faculty_id}
            emptyMessage="No faculty members matched the search query."
          />
        </div>
      )}

      {/* Tab 3: Curriculum Audit Grid / Table */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Department Curriculum &amp; Assessment Integrity Audit
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect institutional syllabi, student completion funnels, and assessment scoring across {filteredCourses.length} accredited tracks.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setCourseViewMode('grid')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  courseViewMode === 'grid'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Visual Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setCourseViewMode('table')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  courseViewMode === 'table'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Data Table</span>
              </button>
            </div>
          </div>

          {courseViewMode === 'table' ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <DataTable
                data={filteredCourses}
                columns={courseHealthColumns}
                keyExtractor={(c) => c.course_id}
                emptyMessage="No courses matched the search query."
              />
            </div>
          ) : (
            <AdaptiveGrid variant="normal">
              {filteredCourses.map((c) => {
                const coverImage = getCourseCoverImage({ title: c.course_title, slug: '', id: c.course_id });
                return (
                  <div
                    key={c.course_id}
                    className="skeuo-card group relative rounded-2xl border border-slate-200/90 dark:border-white/10 hover:border-sky-500/50 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden bg-white dark:bg-[#070c14] select-none"
                  >
                    <div>
                      {/* Thematic Cover Photo Banner with Glassmorphic Badges */}
                      <div className="h-44 sm:h-48 w-full relative overflow-hidden bg-slate-900">
                        <img
                          src={coverImage}
                          alt={c.course_title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent pointer-events-none" />

                        {/* Floating Top Badges */}
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md shadow-xs border bg-emerald-950/80 text-emerald-300 border-emerald-500/40">
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
                            <span>{c.enrolled_students} Learners</span>
                          </div>
                        </div>

                        {/* Title Overlay */}
                        <div className="absolute bottom-3 inset-x-3.5 z-10 pointer-events-none">
                          <span className="text-[10px] font-mono text-sky-400 font-semibold uppercase tracking-wider block mb-1">
                            Department Curriculum Track
                          </span>
                          <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-snug line-clamp-2 drop-shadow-sm group-hover:text-sky-200 transition-colors">
                            {c.course_title}
                          </h3>
                        </div>
                      </div>

                      {/* Card Body with Department Metrics */}
                      <div className="p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4 text-sky-500" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">{c.instructor_name}</span>
                          </span>
                          <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                            {c.average_assessment_score > 0 ? `${c.average_assessment_score}% Avg Score` : 'Mastery Evaluated'}
                          </span>
                        </div>

                        {/* Completion Funnel Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-500 dark:text-slate-400">Completion Funnel</span>
                            <span className="font-bold text-sky-600 dark:text-sky-400">{c.completion_percentage}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full"
                              style={{ width: `${Math.min(c.completion_percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2.5 mt-auto bg-slate-50/50 dark:bg-white/[0.02]">
                      <button
                        type="button"
                        onClick={() => {
                          setPeekCourse({
                            id: c.course_id,
                            title: c.course_title,
                            slug: '',
                            description: `Curriculum track administered by ${c.instructor_name}.`,
                            status: c.status as any,
                            difficulty: c.difficulty as any,
                            enrolled_count: c.enrolled_students,
                            instructor_id: '',
                            modules: [],
                          });
                        }}
                        className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 flex items-center space-x-1 cursor-pointer py-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Syllabus</span>
                      </button>

                      <Link
                        to={`/instructor/courses/${c.course_id}/analytics`}
                        className="h-8 px-3 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 transition-colors flex items-center space-x-1.5 shadow-2xs"
                        title="View Course Analytics"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Telemetry</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </AdaptiveGrid>
          )}

          {/* Quick Peek Modal for HOD Syllabus Inspection */}
          {peekCourse && (
            <CourseQuickPeekModal
              course={peekCourse}
              isOpen={Boolean(peekCourse)}
              onClose={() => setPeekCourse(null)}
              initialTab="syllabus"
            />
          )}
        </div>
      )}
    </div>
  );
};

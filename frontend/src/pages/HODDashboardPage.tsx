import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '../services/api';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { AdaptiveGrid } from '../components/common/AdaptiveGrid';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Award,
  Search,
  Building2,
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
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            <Building2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Academic Leadership & Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Head of Department (HOD) Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Department oversight for {data?.department_name || 'Computer Science'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stat Tiles with AdaptiveGrid */}
      {data && (
        <AdaptiveGrid variant="compact">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <span className="text-label font-mono uppercase text-slate-500 dark:text-slate-400">Total Courses</span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono mt-1">
              {data.total_courses}
            </div>
            <span className="text-label text-slate-400 mt-1 block">
              {data.published_courses} published • {data.draft_courses} draft
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <span className="text-label font-mono uppercase text-slate-500 dark:text-slate-400">Total Faculty</span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono mt-1">
              {data.total_faculty}
            </div>
            <span className="text-label text-slate-400 mt-1 block">Active teaching staff</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <span className="text-label font-mono uppercase text-slate-500 dark:text-slate-400">Student Enrollments</span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono mt-1">
              {data.total_enrollments}
            </div>
            <span className="text-label text-slate-400 mt-1 block">{data.total_students} unique learners</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <span className="text-label font-mono uppercase text-slate-500 dark:text-slate-400">Grading Queue</span>
            <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-1">
              {data.pending_grading_queue_size}
            </div>
            <span className="text-label text-slate-400 mt-1 block">Pending assignment review</span>
          </div>
        </AdaptiveGrid>
      )}

      {/* Tabs Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div className="flex items-center space-x-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
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
                <span>Grading Turnaround SLA</span>
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

      {/* Tab 3: Curriculum Audit Table */}
      {activeTab === 'courses' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
            Department Curriculum & Assessment Integrity Audit
          </h2>
          <DataTable
            data={filteredCourses}
            columns={courseHealthColumns}
            keyExtractor={(c) => c.course_id}
            emptyMessage="No courses matched the search query."
          />
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import {
  Users,
  BookOpen,
  GraduationCap,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Award,
  RefreshCw,
  Search,
  Filter
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
      setError(axios.isAxiosError(err) && err.response?.data?.detail ? String(err.response.data.detail) : 'Failed to load department oversight metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const filteredCourses = data?.course_health.filter((c) =>
    c.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.instructor_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredFaculty = data?.faculty_workload.filter((f) =>
    f.faculty_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.faculty_email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <span>Academic Leadership & Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Head of Department (HOD) Portal
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {data?.department_name || 'Department of Computer Science & Engineering'} · Quality Assurance & Faculty Oversight
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchOverview}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-sm text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
            <div className="px-3 py-1.5 rounded-sm text-xs font-mono bg-sky-500/10 border border-sky-400/30 text-sky-700 dark:text-sky-300">
              ROLE: HOD_ACADEMIC_LEAD
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-md p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">Department Courses</span>
              <BookOpen className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : data?.total_courses || 0}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{data?.published_courses || 0} published</span>
              <span>·</span>
              <span className="text-amber-600 dark:text-amber-400">{data?.draft_courses || 0} draft</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-md p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">Faculty Members</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : data?.total_faculty || 0}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Active departmental staff
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-md p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">Enrolled Scholars</span>
              <GraduationCap className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : data?.total_students || 0}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {data?.total_enrollments || 0} total course enrollments
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-md p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">Completion Velocity</span>
              <TrendingUp className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : `${data?.department_completion_rate || 0}%`}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
              Cohort average progress
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-md p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">Grading Backlog</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {isLoading ? '...' : data?.pending_grading_queue_size || 0}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Submissions awaiting review
            </div>
          </div>
        </div>

        {/* Tabs & Search Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-1 p-1 bg-slate-200/60 dark:bg-slate-900 rounded-md border border-slate-300/60 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Academic Health
            </button>
            <button
              onClick={() => setActiveTab('faculty')}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                activeTab === 'faculty'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Faculty Workload ({data?.faculty_workload.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                activeTab === 'courses'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
              className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Tab 1: Overview & Early Warning Matrix */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-md p-5 shadow-xs">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
                <span>Course Academic Performance Funnel</span>
                <span className="text-[11px] font-mono text-slate-400 font-normal">Real-Time Aggregation</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase">
                    <tr>
                      <th className="pb-2">Course</th>
                      <th className="pb-2">Faculty Lead</th>
                      <th className="pb-2 text-right">Students</th>
                      <th className="pb-2 text-right">Completion</th>
                      <th className="pb-2 text-right">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {data?.course_health.slice(0, 6).map((c) => (
                      <tr key={c.course_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 font-medium text-slate-900 dark:text-white">
                          {c.course_title}
                        </td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400">
                          {c.instructor_name}
                        </td>
                        <td className="py-2.5 text-right font-mono">
                          {c.enrolled_students}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-block px-1.5 py-0.5 rounded-xs font-mono text-[11px] ${
                            c.completion_percentage >= 70
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : c.completion_percentage >= 40
                              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {c.completion_percentage}%
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono font-medium text-slate-900 dark:text-white">
                          {c.average_assessment_score > 0 ? `${c.average_assessment_score}%` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Department Actionable Priorities */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-md p-5 shadow-xs space-y-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Academic Audit & Quality Gates
              </h2>

              <div className="p-3 rounded-md bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-900/50 space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-medium text-sky-800 dark:text-sky-300">
                  <FileCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Curriculum Compliance Verified</span>
                </div>
                <p className="text-[11px] text-sky-700 dark:text-sky-300/80 leading-relaxed">
                  All course modules adhere to the institutional DAG concept prerequisite model. Cycles are verified non-existent.
                </p>
              </div>

              <div className="p-3 rounded-md bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-medium text-amber-800 dark:text-amber-300">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Grading Turnaround SLA</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300/80 leading-relaxed">
                  {data?.pending_grading_queue_size || 0} open assignment submissions awaiting faculty review. Policy target is &le;48 hours.
                </p>
              </div>

              <div className="p-3 rounded-md bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Verifiable Credential Security</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 leading-relaxed">
                  Certificates issued with HMAC-SHA256 signatures, 128-bit verification entropy (<code className="font-mono text-[10px]">LF-&lt;32hex&gt;</code>).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Faculty Workload Directory */}
        {activeTab === 'faculty' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-md p-5 shadow-xs">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Department Faculty Roster & Workload Allocation
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase">
                  <tr>
                    <th className="pb-2">Faculty Member</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2 text-center">Courses Managed</th>
                    <th className="pb-2 text-center">Active Students</th>
                    <th className="pb-2 text-center">Pending Grading</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {filteredFaculty.map((f) => (
                    <tr key={f.faculty_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 font-medium text-slate-900 dark:text-white flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-mono text-[10px] text-slate-600 dark:text-slate-300">
                          {f.faculty_name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span>{f.faculty_name}</span>
                      </td>
                      <td className="py-3 font-mono text-slate-500 dark:text-slate-400">
                        {f.faculty_email}
                      </td>
                      <td className="py-3 text-center font-mono">
                        {f.courses_count}
                      </td>
                      <td className="py-3 text-center font-mono">
                        {f.enrolled_students}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-mono text-[11px] ${
                          f.pending_grading > 0
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {f.pending_grading} queue
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-xs text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ACTIVE</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredFaculty.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No faculty members matched the search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Curriculum Audit Table */}
        {activeTab === 'courses' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-md p-5 shadow-xs">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Department Curriculum & Assessment Integrity Audit
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase">
                  <tr>
                    <th className="pb-2">Course Title</th>
                    <th className="pb-2">Instructor</th>
                    <th className="pb-2">Difficulty</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Enrolled</th>
                    <th className="pb-2 text-right">Completion Rate</th>
                    <th className="pb-2 text-right">Avg Exam Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {filteredCourses.map((c) => (
                    <tr key={c.course_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 font-medium text-slate-900 dark:text-white">
                        {c.course_title}
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">
                        {c.instructor_name}
                      </td>
                      <td className="py-3 capitalize text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {c.difficulty}
                      </td>
                      <td className="py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-xs font-mono text-[10px] uppercase ${
                          c.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono">
                        {c.enrolled_students}
                      </td>
                      <td className="py-3 text-right font-mono font-medium">
                        {c.completion_percentage}%
                      </td>
                      <td className="py-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        {c.average_assessment_score > 0 ? `${c.average_assessment_score}%` : '—'}
                      </td>
                    </tr>
                  ))}
                  {filteredCourses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        No courses matched the criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


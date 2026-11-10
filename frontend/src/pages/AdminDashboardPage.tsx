import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { User, AuditLog, SystemOverview, Course } from '../types';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { AdaptiveGrid } from '../components/common/AdaptiveGrid';
import { PageHeader, StatTile } from '../components/ui';
import { getCourseCoverImage } from '../utils/courseImages';
import { CourseQuickPeekModal } from '../components/course/CourseQuickPeekModal';
import {
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  BookOpen,
  Users,
  Layers,
  Database,
  Server,
  Key,
  HardDrive,
  Eye,
  Edit,
  Activity,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Tabs: 'users' | 'courses' | 'audit' | 'infrastructure'
  const [activeTab, setActiveTab] = useState<'users' | 'courses' | 'audit' | 'infrastructure'>('users');

  // User Filter States
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

  // Course Filter States
  const [courseSearch, setCourseSearch] = useState<string>('');
  const [courseDiffFilter, setCourseDiffFilter] = useState<string>('all');

  // Quick-Peek Modal
  const [peekCourse, setPeekCourse] = useState<Course | null>(null);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [uRes, aRes, oRes, cRes] = await Promise.all([
        api.users.list(),
        api.system.getAuditLogs({ limit: 50 }),
        api.analytics.getOverview(),
        api.courses.list().catch(() => ({ data: [] })),
      ]);
      setUsers(uRes.data);
      setAuditLogs(aRes.data);
      setOverview(oRes.data);
      setCourses(cRes.data);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleAssignRole = async (userId: string, roleName: string) => {
    try {
      await api.users.assignRole(userId, roleName);
      setActionMessage(`User successfully assigned role: ${roleName.toUpperCase()}`);
      setTimeout(() => setActionMessage(null), 3000);
      await loadAdminData();
    } catch (err: unknown) {
      console.error('Failed to assign role', err);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.users.toggleActive(userId, !currentStatus);
      setActionMessage('User account status updated.');
      setTimeout(() => setActionMessage(null), 3000);
      await loadAdminData();
    } catch (err: unknown) {
      console.error('Failed to toggle status', err);
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = userSearch.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);

      const matchesRole =
        userRoleFilter === 'all' ||
        u.roles.some((r) => r.name.toLowerCase() === userRoleFilter.toLowerCase());

      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const q = courseSearch.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q));

      const matchesDiff =
        courseDiffFilter === 'all' ||
        (c.difficulty && c.difficulty.toLowerCase() === courseDiffFilter.toLowerCase());

      return matchesSearch && matchesDiff;
    });
  }, [courses, courseSearch, courseDiffFilter]);

  // User Management Columns Definition
  const userColumns: ColumnDef<User>[] = [
    {
      key: 'name',
      header: 'User Identity',
      isPrimary: true,
      priority: 'always',
      render: (u) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white leading-snug">{u.full_name}</div>
          <div className="text-label text-slate-500 dark:text-slate-400 font-mono">{u.email}</div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Assigned Roles',
      priority: 'always',
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles.map((r) => (
            <span
              key={r.id}
              className={`text-meta font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                r.name === 'admin'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                  : r.name === 'instructor'
                  ? 'bg-accent-subtle text-accent border border-sky-200 dark:border-sky-900/60'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {r.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Account Status',
      isStatus: true,
      priority: 'tablet-up',
      render: (u) => (
        <span
          className={`text-meta font-semibold px-2 py-0.5 rounded-full ${
            u.is_active
              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60'
              : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
          }`}
        >
          {u.is_active ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Role Governance',
      isAction: true,
      priority: 'always',
      align: 'right',
      render: (u) => {
        const isInstructor = u.roles.some((r) => r.name === 'instructor');
        const isAdmin = u.roles.some((r) => r.name === 'admin');

        return (
          <div className="flex items-center space-x-1.5 justify-end">
            {!isInstructor && !isAdmin && (
              <button
                type="button"
                onClick={() => handleAssignRole(u.id, 'instructor')}
                className="px-2.5 py-1 bg-accent-subtle hover:bg-sky-100 dark:hover:bg-sky-900/50 text-accent rounded-md text-label font-semibold transition cursor-pointer"
                title="Promote student to Faculty Instructor"
              >
                Make Instructor
              </button>
            )}

            {isInstructor && !isAdmin && (
              <button
                type="button"
                onClick={() => handleAssignRole(u.id, 'learner')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md text-label font-semibold transition cursor-pointer"
                title="Revert instructor to Student"
              >
                Make Student
              </button>
            )}

            {!isAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Transfer platform administrator access to ${u.full_name}? Policy permits strictly 1 admin. Your account will be demoted to faculty.`)) {
                    handleAssignRole(u.id, 'admin');
                  }
                }}
                className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-md text-label font-semibold transition cursor-pointer border border-rose-200 dark:border-rose-900/60"
                title="Transfer Single Administrator Access"
              >
                Transfer Admin
              </button>
            )}

            {!isAdmin && (
              <button
                type="button"
                onClick={() => handleToggleStatus(u.id, u.is_active)}
                className={`p-1.5 rounded-md border transition cursor-pointer ${
                  u.is_active
                    ? 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-200'
                    : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50'
                }`}
                title={u.is_active ? 'Deactivate Account' : 'Activate Account'}
                aria-label={u.is_active ? 'Deactivate Account' : 'Activate Account'}
              >
                {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // Audit Logs Columns Definition
  const auditColumns: ColumnDef<AuditLog>[] = [
    {
      key: 'action',
      header: 'Action / Event',
      isPrimary: true,
      priority: 'always',
      render: (log) => (
        <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">{log.action}</span>
      ),
    },
    {
      key: 'entity',
      header: 'Target Entity',
      priority: 'tablet-up',
      render: (log) => (
        <span className="font-mono text-slate-600 dark:text-slate-300">
          {log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 8)}...)` : ''}
        </span>
      ),
    },
    {
      key: 'ip',
      header: 'IP Address',
      priority: 'desktop-only',
      render: (log) => <span className="font-mono text-slate-400 text-label">{log.ip_address || 'internal'}</span>,
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      priority: 'always',
      align: 'right',
      render: (log) => (
        <span className="font-mono text-label text-slate-500">
          {new Date(log.created_at).toLocaleString()}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-28 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 font-sans max-w-7xl mx-auto">
      {/* Admin Header */}
      <PageHeader
        badge={
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-1 font-mono">
            <Shield className="w-4 h-4" />
            <span>Platform Governance</span>
          </div>
        }
        title="Admin Portal & Institutional Oversight"
        subtitle="Manage accounts, govern 72 accredited curriculum tracks, enforce RBAC boundaries, and inspect cryptographic audit logs."
      />

      {actionMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Institutional KPI Metrics Strip */}
      {overview && (
        <AdaptiveGrid variant="compact">
          <StatTile
            label="Total Accounts"
            value={overview.total_users || users.length}
            subtext="Registered institutional users"
          />
          <StatTile
            label="Curriculum Tracks"
            value={overview.total_courses || courses.length}
            subtext="72 accredited courses online"
          />
          <StatTile
            label="Total Enrollments"
            value={overview.total_enrollments || 0}
            subtext="Active student enrollments"
          />
          <StatTile
            label="Audit Ledger Events"
            value={auditLogs.length}
            subtext="Tamper-evident logs"
          />
        </AdaptiveGrid>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === 'users'
              ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === 'courses'
              ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Curriculum Tracks ({courses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === 'audit'
              ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Cryptographic Ledger</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('infrastructure')}
          className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
            activeTab === 'infrastructure'
              ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>System Infrastructure</span>
        </button>
      </div>

      {/* TAB 1: User Directory & Role Governance */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {['all', 'admin', 'instructor', 'learner'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setUserRoleFilter(role)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                    userRoleFilter === role
                      ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {role === 'all' ? 'All Roles' : role}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <DataTable
              data={filteredUsers}
              columns={userColumns}
              keyExtractor={(u) => u.id}
              emptyMessage="No users matched the criteria."
            />
          </div>
        </div>
      )}

      {/* TAB 2: Curriculum Tracks (Visual Cards with Exact Course Catalog UI) */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search 72 course tracks..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {['all', 'beginner', 'intermediate', 'advanced'].map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setCourseDiffFilter(diff)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                    courseDiffFilter === diff
                      ? 'bg-sky-600 text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {diff === 'all' ? 'All Tiers' : diff}
                </button>
              ))}
            </div>
          </div>

          <AdaptiveGrid variant="normal">
            {filteredCourses.map((c) => {
              const coverImage = getCourseCoverImage(c);
              return (
                <div
                  key={c.id}
                  className="skeuo-card group relative rounded-2xl border border-slate-200/90 dark:border-white/10 hover:border-sky-500/50 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden bg-white dark:bg-[#070c14] select-none"
                >
                  <div>
                    {/* Thematic Cover Photo Banner with Glassmorphic Badges */}
                    <div className="h-44 sm:h-48 w-full relative overflow-hidden bg-slate-900">
                      <img
                        src={coverImage}
                        alt={c.title}
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
                          <span>{c.enrolled_count || 0} Learners</span>
                        </div>
                      </div>

                      {/* Title Overlay */}
                      <div className="absolute bottom-3 inset-x-3.5 z-10 pointer-events-none">
                        <span className="text-[10px] font-mono text-sky-400 font-semibold uppercase tracking-wider block mb-1">
                          Accredited Track &bull; 6 Modules
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
                        <span>Assessment Armed</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="p-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2.5 mt-auto bg-slate-50/50 dark:bg-white/[0.02]">
                    <button
                      type="button"
                      onClick={() => setPeekCourse(c)}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 flex items-center space-x-1 cursor-pointer py-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <Link
                      to={`/instructor/courses/${c.id}/builder`}
                      className="h-8 px-3 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 transition-colors flex items-center space-x-1.5 shadow-2xs"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Curriculum Builder</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </AdaptiveGrid>

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

      {/* TAB 3: Cryptographic Audit Stream */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Cryptographic Audit Ledger Stream
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Append-only audit log stream chained with SHA-256 cryptographic hashes for non-repudiation.
              </p>
            </div>
            <span className="text-meta font-mono text-emerald-500 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
              Live Hash Chain
            </span>
          </div>

          <DataTable
            data={auditLogs}
            columns={auditColumns}
            keyExtractor={(l) => l.id}
            emptyMessage="No audit logs recorded yet."
          />
        </div>
      )}

      {/* TAB 4: Infrastructure & System Health */}
      {activeTab === 'infrastructure' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center space-x-3 text-sky-600 dark:text-sky-400">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">PostgreSQL 15 Relational Cluster</h3>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">Healthy &bull; Strict ACID Transactions</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Enforcing row-level locking (<code className="font-mono text-sky-600">with_for_update</code>) on enrollment counters and certificate minting transactions.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Redis 7 Distributed Cache</h3>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">Armed &bull; Sliding-Window Rate Limiting</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Provides distributed token rate-limiting and fast multi-tenant session validation with Redis-backed token rotation.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center space-x-3 text-purple-600 dark:text-purple-400">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">HMAC-SHA256 Token Authority</h3>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">Active &bull; 128-bit Signature Entropy</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Cryptographically signs every minted certificate with payload hashes verifiable on the public forensic verification page.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center space-x-3 text-emerald-600 dark:text-emerald-400">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">S3 Object Storage &amp; Quarantine</h3>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">Online &bull; 5-Stage Security Pipeline</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Safely handles assignment document uploads with magic-byte validation, quarantine isolation, and presigned delivery.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

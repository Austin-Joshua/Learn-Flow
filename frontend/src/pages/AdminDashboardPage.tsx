import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, AuditLog, SystemOverview } from '../types';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { AdaptiveGrid } from '../components/common/AdaptiveGrid';
import {
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [uRes, aRes, oRes] = await Promise.all([
        api.users.list(),
        api.system.getAuditLogs({ limit: 25 }),
        api.analytics.getOverview(),
      ]);
      setUsers(uRes.data);
      setAuditLogs(aRes.data);
      setOverview(oRes.data);
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
                  : r.name === 'hod'
                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900/60'
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
        const isHOD = u.roles.some((r) => r.name === 'hod');
        const isAdmin = u.roles.some((r) => r.name === 'admin');

        return (
          <div className="flex items-center space-x-1.5 justify-end">
            {!isInstructor && !isAdmin && (
              <button
                type="button"
                onClick={() => handleAssignRole(u.id, 'instructor')}
                className="px-2.5 py-1 bg-accent-subtle hover:bg-sky-100 dark:hover:bg-sky-900/50 text-accent rounded-md text-label font-semibold transition"
              >
                Make Staff
              </button>
            )}

            {!isHOD && !isAdmin && (
              <button
                type="button"
                onClick={() => handleAssignRole(u.id, 'hod')}
                className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 rounded-md text-label font-semibold transition"
              >
                Make HOD
              </button>
            )}

            {!isAdmin && (
              <button
                type="button"
                onClick={() => handleToggleStatus(u.id, u.is_active)}
                className={`p-1.5 rounded-md border transition ${
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
    <div className="space-y-8 font-sans">
      <div>
        <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 font-mono">
          <Shield className="w-4 h-4" />
          <span>Platform Governance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Admin Portal & Security Audit
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Authorize institutional roles, enforce RBAC boundaries, and inspect cryptographic audit logs.
        </p>
      </div>

      {actionMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Responsive Stat Tiles */}
      {overview && (
        <AdaptiveGrid variant="compact">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <span className="text-label font-bold text-slate-400 uppercase tracking-wider font-mono">
              Total Users
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
              {overview.total_users || users.length}
            </div>
            <span className="text-label text-slate-500 dark:text-slate-400 mt-1 block">
              Registered accounts
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <span className="text-label font-bold text-slate-400 uppercase tracking-wider font-mono">
              Published Courses
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
              {overview.total_courses || 0}
            </div>
            <span className="text-label text-slate-500 dark:text-slate-400 mt-1 block">Active curriculum</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <span className="text-label font-bold text-slate-400 uppercase tracking-wider font-mono">
              Total Enrollments
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
              {overview.total_enrollments || 0}
            </div>
            <span className="text-label text-slate-500 dark:text-slate-400 mt-1 block">Student enrollments</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <span className="text-label font-bold text-slate-400 uppercase tracking-wider font-mono">
              Audited Events
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
              {auditLogs.length}
            </div>
            <span className="text-label text-slate-500 dark:text-slate-400 mt-1 block">
              Recent ledger records
            </span>
          </div>
        </AdaptiveGrid>
      )}

      {/* User Management Section with Adaptive DataTable */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Institutional User Directory
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage accounts and grant authoritative roles.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">
            {users.length} Users
          </span>
        </div>

        <DataTable
          data={users}
          columns={userColumns}
          keyExtractor={(u) => u.id}
          emptyMessage="No users found in directory."
        />
      </div>

      {/* Append-Only Audit Ledger with SHA-256 Hash Chain */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Cryptographic Audit Stream
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Append-only audit log stream chained with SHA-256 cryptographic hashes.
            </p>
          </div>
          <span className="text-meta font-mono text-emerald-500 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
            Active Stream
          </span>
        </div>

        <DataTable
          data={auditLogs}
          columns={auditColumns}
          keyExtractor={(l) => l.id}
          emptyMessage="No audit logs recorded yet."
        />
      </div>
    </div>
  );
};

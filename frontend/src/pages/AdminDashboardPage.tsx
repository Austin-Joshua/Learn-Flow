import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, AuditLog } from '../types';
import {
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  FileText,
  Clock,
  Sparkles,
  TrendingUp,
  KeyRound
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [overview, setOverview] = useState<any>(null);
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
    } catch (err: any) {
      console.error('Failed to assign role', err);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.users.toggleActive(userId, !currentStatus);
      setActionMessage(`User account status updated.`);
      setTimeout(() => setActionMessage(null), 3000);
      await loadAdminData();
    } catch (err: any) {
      console.error('Failed to toggle status', err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      <div className="mb-10">
        <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 font-mono">
          <Shield className="w-4 h-4" />
          <span>Platform Governance</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Admin Portal & Security Audit
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Authorize roles, enforce institutional security, and inspect tamper-evident audit records.
        </p>
      </div>

      {actionMessage && (
        <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-10">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Total Users</span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{overview.total_users || users.length}</div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Registered accounts</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Total Courses</span>
            <div className="text-3xl font-black text-sky-600 dark:text-sky-400 mt-2">{overview.total_courses || 0}</div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Published curriculum</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Enrollments</span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{overview.total_enrollments || 0}</div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Active learners</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Certificates Minted</span>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{overview.total_certificates_issued || 0}</div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Verified credentials</span>
          </div>
        </div>
      )}

      {/* User Management Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden mb-12">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">User Directory & Role Delegation</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Securely provision instructor and HOD credentials to qualified accounts.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 font-mono">
            {users.length} Users
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-x-auto">
          {users.map((u) => {
            const isInstructor = u.roles.some((r) => r.name === 'instructor');
            const isHOD = u.roles.some((r) => r.name === 'hod');
            const isAdmin = u.roles.some((r) => r.name === 'admin');

            return (
              <div
                key={u.id}
                className="p-5 px-6 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition min-w-[600px]"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{u.full_name}</span>
                    <span className="text-xs text-slate-400 font-mono">({u.email})</span>
                  </div>

                  <div className="flex items-center space-x-2 mt-1.5">
                    {u.roles.map((r) => (
                      <span
                        key={r.id}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          r.name === 'admin'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                            : r.name === 'hod'
                            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900/60'
                            : r.name === 'instructor'
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {r.name}
                      </span>
                    ))}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      u.is_active ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40' : 'text-slate-400 bg-slate-100 dark:bg-slate-800'
                    }`}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!isInstructor && !isAdmin && (
                    <button
                      onClick={() => handleAssignRole(u.id, 'instructor')}
                      className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold transition"
                    >
                      Make Staff
                    </button>
                  )}

                  {!isHOD && !isAdmin && (
                    <button
                      onClick={() => handleAssignRole(u.id, 'hod')}
                      className="px-3 py-1 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 rounded-lg text-xs font-semibold transition"
                    >
                      Make HOD
                    </button>
                  )}

                  {!isAdmin && (
                    <button
                      onClick={() => handleToggleStatus(u.id, u.is_active)}
                      className={`p-1.5 rounded-lg border transition ${
                        u.is_active
                          ? 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-200'
                          : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={u.is_active ? 'Deactivate Account' : 'Activate Account'}
                    >
                      {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Append-only Tamper-Evident Audit Log Viewer */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden text-slate-200">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Append-Only Tamper-Evident Audit Ledger
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cryptographically tracked platform events, actor attribution, and IP addresses.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
            Audit Stream Active
          </span>
        </div>

        <div className="divide-y divide-slate-800/60 font-mono text-xs overflow-x-auto">
          {auditLogs.length > 0 ? (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition min-w-[700px]"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-indigo-400 font-bold">{log.action}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">
                    entity: <span className="text-slate-200">{log.entity_type}</span>
                  </span>
                  {log.ip_address && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-500">ip: {log.ip_address}</span>
                    </>
                  )}
                </div>

                <div className="text-slate-500 text-[11px]">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500 italic">
              No audit logs recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


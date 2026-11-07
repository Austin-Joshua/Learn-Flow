import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, AuditLog } from '../types';
import {
  Shield,
  Users,
  ShieldCheck,
  Award,
  BookOpen,
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

  const handlePromoteToInstructor = async (userId: string) => {
    try {
      await api.users.assignRole(userId, 'instructor');
      setActionMessage('User successfully promoted to Instructor.');
      setTimeout(() => setActionMessage(null), 3000);
      await loadAdminData();
    } catch (err: any) {
      console.error('Failed to promote user', err);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <div className="flex items-center space-x-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-2">
          <Shield className="w-4 h-4" />
          <span>Platform Governance</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Admin Portal & Security Audit
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Authorize roles, enforce institutional security, and inspect tamper-evident audit records.
        </p>
      </div>

      {actionMessage && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
            <div className="text-3xl font-black text-slate-900 mt-2">{overview.total_users || users.length}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Registered accounts</span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Courses</span>
            <div className="text-3xl font-black text-indigo-600 mt-2">{overview.total_courses || 0}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Published curriculum</span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enrollments</span>
            <div className="text-3xl font-black text-slate-900 mt-2">{overview.total_enrollments || 0}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Active learners</span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Certificates Minted</span>
            <div className="text-3xl font-black text-emerald-600 mt-2">{overview.total_certificates_issued || 0}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Verified credentials</span>
          </div>
        </div>
      )}

      {/* User Management Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-12">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">User Directory & Role Delegation</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely provision instructor credentials to qualified accounts.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-full text-slate-600">
            {users.length} Users
          </span>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {users.map((u) => {
            const isInstructor = u.roles.some((r) => r.name === 'instructor');
            const isAdmin = u.roles.some((r) => r.name === 'admin');

            return (
              <div
                key={u.id}
                className="p-5 px-6 flex items-center justify-between hover:bg-slate-50/60 transition min-w-[600px]"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-900">{u.full_name}</span>
                    <span className="text-xs text-slate-400 font-mono">({u.email})</span>
                  </div>

                  <div className="flex items-center space-x-2 mt-1.5">
                    {u.roles.map((r) => (
                      <span
                        key={r.id}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          r.name === 'admin'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : r.name === 'instructor'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {r.name}
                      </span>
                    ))}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      u.is_active ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                    }`}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!isInstructor && !isAdmin && (
                    <button
                      onClick={() => handlePromoteToInstructor(u.id)}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                    >
                      Promote to Instructor
                    </button>
                  )}

                  {!isAdmin && (
                    <button
                      onClick={() => handleToggleStatus(u.id, u.is_active)}
                      className={`p-1.5 rounded-lg border transition ${
                        u.is_active
                          ? 'border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
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

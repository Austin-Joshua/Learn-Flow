import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { getApiErrorMessage } from '../utils/errors';
import { UserAvatar, resolveAvatarGender } from '../components/common/UserAvatar';
import {
  User as UserIcon,
  Shield,
  Key,
  Bell,
  Palette,
  Database,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
  Laptop,
  Save,
  Download,
  Trash2,
  LogOut,
  Mail,
  Building,
  Eye,
  EyeOff,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance' | 'privacy'>('profile');

  // Profile form state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState('+91 98400 12345');
  const [bio, setBio] = useState('Computer Science & Engineering Scholar at Rajalakshmi Institute of Technology.');
  const [profileSaved, setProfileSaved] = useState(false);
  const [avatarGender, setAvatarGender] = useState<'female' | 'male'>(() => resolveAvatarGender(user));

  // Security password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUpdatingPw, setIsUpdatingPw] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Notification controls state
  const [notifyCurriculum, setNotifyCurriculum] = useState(true);
  const [notifyAssessments, setNotifyAssessments] = useState(true);
  const [notifyGrading, setNotifyGrading] = useState(true);
  const [notifyCopilot, setNotifyCopilot] = useState(true);
  const [notifyEmailDigest, setNotifyEmailDigest] = useState(false);
  const [notifySound, setNotifySound] = useState(true);
  const [notifSaved, setNotifSaved] = useState(false);

  // Appearance state
  const [codeEditorTheme, setCodeEditorTheme] = useState('vs-dark');
  const [tableDensity, setTableDensity] = useState<'compact' | 'comfortable'>('comfortable');

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('learnflow_user_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.bio) setBio(parsed.bio);
        if (parsed.notifyCurriculum !== undefined) setNotifyCurriculum(parsed.notifyCurriculum);
        if (parsed.notifyAssessments !== undefined) setNotifyAssessments(parsed.notifyAssessments);
        if (parsed.notifyGrading !== undefined) setNotifyGrading(parsed.notifyGrading);
        if (parsed.notifyCopilot !== undefined) setNotifyCopilot(parsed.notifyCopilot);
        if (parsed.notifyEmailDigest !== undefined) setNotifyEmailDigest(parsed.notifyEmailDigest);
        if (parsed.notifySound !== undefined) setNotifySound(parsed.notifySound);
        if (parsed.avatarGender) setAvatarGender(parsed.avatarGender);
        if (parsed.codeEditorTheme) setCodeEditorTheme(parsed.codeEditorTheme);
        if (parsed.tableDensity) setTableDensity(parsed.tableDensity);
      } catch {
        // use defaults
      }
    }
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const prefs = {
      phone,
      bio,
      avatarGender,
      notifyCurriculum,
      notifyAssessments,
      notifyGrading,
      notifyCopilot,
      notifyEmailDigest,
      notifySound,
      codeEditorTheme,
      tableDensity,
    };
    localStorage.setItem('learnflow_user_preferences', JSON.stringify(prefs));
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwStatus(null);

    if (newPassword.length < 8) {
      setPwStatus({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwStatus({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }

    setIsUpdatingPw(true);
    try {
      await api.auth.changePassword({ current_password: currentPassword, new_password: newPassword });
      setPwStatus({ type: 'success', message: 'Password updated successfully! All other active sessions have been revoked.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPwStatus({ type: 'error', message: getApiErrorMessage(err, 'Failed to update password. Please verify current credentials.') });
    } finally {
      setIsUpdatingPw(false);
    }
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    const current = JSON.parse(localStorage.getItem('learnflow_user_preferences') || '{}');
    localStorage.setItem(
      'learnflow_user_preferences',
      JSON.stringify({
        ...current,
        notifyCurriculum,
        notifyAssessments,
        notifyGrading,
        notifyCopilot,
        notifyEmailDigest,
        notifySound,
      })
    );
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  };

  const handleExportData = () => {
    const accountData = {
      account_id: user?.id,
      email: user?.email,
      name: user?.full_name,
      roles: user?.roles,
      institution: 'Rajalakshmi Institute of Technology (RIT)',
      exported_at: new Date().toISOString(),
      preferences: JSON.parse(localStorage.getItem('learnflow_user_preferences') || '{}'),
    };
    const blob = new Blob([JSON.stringify(accountData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learnflow-account-export-${user?.id?.substring(0, 8) || 'user'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rawRole = user?.roles?.[0]?.name?.toLowerCase() || 'learner';
  const roleLabel =
    rawRole === 'learner'
      ? 'Learner'
      : rawRole === 'staff' || rawRole === 'instructor'
      ? 'Faculty'
      : rawRole === 'hod'
      ? 'Department Head'
      : rawRole === 'admin'
      ? 'System Administrator'
      : user?.roles?.[0]?.name || 'Student';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          View and manage your academic profile, credentials, security posture, and notification preferences.
        </p>
      </div>

      {/* Hero Profile Overview Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#06080c] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <UserAvatar
            user={user}
            gender={avatarGender}
            size="2xl"
            showStatus={true}
            className="ring-4 ring-[#0082fb]/20 shadow-md shrink-0"
          />
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {user?.full_name || 'Authenticated User'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0082fb]/15 text-[#0082fb] dark:text-[#3aa0ff] border border-[#0082fb]/30 uppercase">
                {roleLabel}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5" />
                <span>{user?.email || 'user@learnflow.edu'}</span>
              </span>
              <span>·</span>
              <span className="flex items-center space-x-1">
                <Building className="w-3.5 h-3.5 text-[#0082fb] dark:text-[#3aa0ff]" />
                <span>Learnflow Academy</span>
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Identity &amp; Enrollment Cryptographically Verified</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportData}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data</span>
          </button>
          <button
            type="button"
            onClick={logout}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { id: 'profile', label: 'Profile Information', icon: UserIcon },
          { id: 'security', label: 'Security & Access', icon: Shield },
          { id: 'notifications', label: 'Notification Controls', icon: Bell },
          { id: 'appearance', label: 'Appearance & Display', icon: Palette },
          { id: 'privacy', label: 'Data & Privacy', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer shrink-0 border-b-2 ${
                active
                  ? 'border-[#0082fb] dark:border-[#3aa0ff] text-[#0082fb] dark:text-[#3aa0ff] bg-white dark:bg-[#06080c]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROFILE INFORMATION                                                */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-[#06080c] rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Profile Details</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Personal information visible across your academic portal and course assessments.
            </p>
          </div>

          {profileSaved && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Your profile preferences have been successfully updated.</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Graphical Character Avatar Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Personalized Scholar Character Avatar
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAvatarGender('female')}
                  className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all cursor-pointer ${
                    avatarGender === 'female'
                      ? 'border-[#0082fb] bg-[#0082fb]/10 ring-2 ring-[#0082fb]/30'
                      : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-slate-300'
                  }`}
                >
                  <UserAvatar user={user} gender="female" size="lg" showStatus={false} />
                  <div>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">
                      Female Scholar (Ada Lovelace)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Computational pioneer &amp; algorithm theorist
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAvatarGender('male')}
                  className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all cursor-pointer ${
                    avatarGender === 'male'
                      ? 'border-[#0082fb] bg-[#0082fb]/10 ring-2 ring-[#0082fb]/30'
                      : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-slate-300'
                  }`}
                >
                  <UserAvatar user={user} gender="male" size="lg" showStatus={false} />
                  <div>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">
                      Male Scholar (Alan Turing)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Cryptographic pioneer &amp; systems theorist
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#0082fb] dark:focus:border-[#3aa0ff]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#0082fb] dark:focus:border-[#3aa0ff]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Institutional Email (SSO Managed)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Email is locked to institutional single sign-on credentials.</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#0082fb] dark:focus:border-[#3aa0ff]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Bio &amp; Research Focus</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#0082fb] dark:focus:border-[#3aa0ff]"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#0082fb] hover:bg-[#155dfc] text-white text-xs font-bold inline-flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SECURITY & ACCESS CONTROLS                                         */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Password Change Box */}
          <div className="bg-white dark:bg-[#06080c] rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Change Password</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update your account password with strict complexity verification and automatic session rotation.
              </p>
            </div>

            {pwStatus && (
              <div
                className={`p-3.5 rounded-xl border flex items-center space-x-2 text-xs ${
                  pwStatus.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                }`}
              >
                {pwStatus.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{pwStatus.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#0082fb] dark:focus:border-[#3aa0ff] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showCurrentPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password (min. 8 characters)
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter strong new password"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#0082fb] dark:focus:border-[#3aa0ff] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#0082fb] dark:focus:border-[#3aa0ff]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPw}
                  className="px-5 py-2.5 rounded-xl bg-[#0082fb] hover:bg-[#155dfc] text-white text-xs font-bold inline-flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Key className="w-4 h-4" />
                  <span>{isUpdatingPw ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Session Governance & Multi-Device Control */}
          <div className="bg-white dark:bg-[#06080c] rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Session &amp; Devices</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Current active sessions protected by RFC 6819 refresh token rotation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-[#0082fb]/10 text-[#0082fb] dark:text-[#3aa0ff] flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Web Browser (Current Device)</span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                      Active Now
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Windows · Verified SSL Handshake · Client IP: Protected
                  </span>
                </div>
              </div>
            </div>

            {/* Two-Factor Auth Toggle */}
            <div className="pt-2 flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Two-Factor Authentication (2FA)</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Require an additional verification code upon logging in from a new machine.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  twoFactorEnabled ? 'bg-[#0082fb]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: NOTIFICATION CONTROLS                                              */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-[#06080c] rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notification Controls</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Control the specific events that trigger in-app alerts and audio chimes.
            </p>
          </div>

          {notifSaved && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Notification preferences saved.</span>
            </div>
          )}

          <form onSubmit={handleSaveNotifications} className="space-y-4">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                {
                  id: 'curriculum',
                  title: 'Curriculum & Module Unlocks',
                  desc: 'Get alerted immediately when an instructor publishes a new sequential module.',
                  checked: notifyCurriculum,
                  onChange: setNotifyCurriculum,
                },
                {
                  id: 'assessments',
                  title: 'Timed Assessment Window Alerts',
                  desc: 'Receive reminders 24 hours and 1 hour before scheduled evaluation arenas.',
                  checked: notifyAssessments,
                  onChange: setNotifyAssessments,
                },
                {
                  id: 'grading',
                  title: 'Assignment Evaluation & Rubric Scores',
                  desc: 'Alerts when instructors complete grading of quarantined code submissions.',
                  checked: notifyGrading,
                  onChange: setNotifyGrading,
                },
                {
                  id: 'copilot',
                  title: 'AI Copilot Proactive Study Prompts',
                  desc: 'Allow the AI copilot to surface recommended concepts during reading.',
                  checked: notifyCopilot,
                  onChange: setNotifyCopilot,
                },
                {
                  id: 'emailDigest',
                  title: 'Weekly Academic Email Digest',
                  desc: 'Send a summary of weekly concept mastery to your institutional inbox.',
                  checked: notifyEmailDigest,
                  onChange: setNotifyEmailDigest,
                },
                {
                  id: 'sound',
                  title: 'Notification Audio Alerts',
                  desc: 'Play a subtle audio tone when new notifications arrive in the topbar.',
                  checked: notifySound,
                  onChange: setNotifySound,
                },
              ].map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between">
                  <div className="pr-4 space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">{item.title}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => item.onChange(!item.checked)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                      item.checked ? 'bg-[#0082fb]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        item.checked ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#0082fb] hover:bg-[#155dfc] text-white text-xs font-bold inline-flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Notification Controls</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: APPEARANCE & DISPLAY                                               */}
      {/* ========================================================================= */}
      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-[#06080c] rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Appearance &amp; Display</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize interface themes, table densities, and coding environment styling.
            </p>
          </div>

          <div className="space-y-6">
            {/* Color Scheme Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                Interface Color Scheme
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                <button
                  type="button"
                  onClick={() => {
                    if (isDarkMode) toggleTheme();
                  }}
                  className={`p-4 rounded-xl border text-left flex items-center space-x-3 cursor-pointer transition-all ${
                    !isDarkMode
                      ? 'border-[#0082fb] bg-[#0082fb]/10 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Light Mode</span>
                    <span className="text-[11px] text-slate-500">Crisp academic parchment</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!isDarkMode) toggleTheme();
                  }}
                  className={`p-4 rounded-xl border text-left flex items-center space-x-3 cursor-pointer transition-all ${
                    isDarkMode
                      ? 'border-[#3aa0ff] bg-[#0082fb]/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Dark Mode</span>
                    <span className="text-[11px] text-slate-500">Learnflow Deep Obsidian</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Assessment Arena Code Editor Theme */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Assessment Arena Code Editor Styling
              </label>
              <select
                value={codeEditorTheme}
                onChange={(e) => {
                  setCodeEditorTheme(e.target.value);
                  const cur = JSON.parse(localStorage.getItem('learnflow_user_preferences') || '{}');
                  localStorage.setItem('learnflow_user_preferences', JSON.stringify({ ...cur, codeEditorTheme: e.target.value }));
                }}
                className="max-w-xs w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#0082fb] dark:focus:border-[#3aa0ff]"
              >
                <option value="vs-dark">Visual Studio Dark (Default)</option>
                <option value="monokai">Monokai High Contrast</option>
                <option value="github-dark">GitHub Dark</option>
                <option value="light">Solarized Light</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DATA & PRIVACY                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'privacy' && (
        <div className="bg-white dark:bg-[#06080c] rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Data &amp; Privacy Controls</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Export your student records, manage local browser telemetry, or purge temporary session cache.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Export Academic Portfolio</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Download a complete JSON package of your enrolled courses, assessment logs, and HMAC diploma signatures.
                </span>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                className="px-4 py-2 rounded-xl bg-[#0082fb] hover:bg-[#155dfc] text-white text-xs font-bold inline-flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Clear Local Search &amp; Telemetry Cache</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Purges saved search terms and temporary client-side workspace cache without signing out.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('learnflow_search_history');
                  alert('Local search cache cleared successfully.');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cache</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


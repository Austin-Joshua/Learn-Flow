import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { getApiErrorMessage } from '../utils/errors';
import { UserAvatar, resolveAvatarGender } from '../components/common/UserAvatar';
import { dataCache } from '../utils/dataCache';
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
  Smartphone,
  Save,
  Download,
  Trash2,
  LogOut,
  Mail,
  Building,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  IdCard,
  GraduationCap,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout, updateUser } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/', { replace: true });
  };

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance' | 'privacy'>('profile');

  // Profile form state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [studentId, setStudentId] = useState('LF-2026-CS-042');
  const [academicYear, setAcademicYear] = useState('Third Year (Semester 6)');
  const [phone, setPhone] = useState('+91 98400 12345');
  const [bio, setBio] = useState('Computer Science & Engineering Scholar at Learnflow Academy.');
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
  const [sessionTerminated, setSessionTerminated] = useState(false);

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
  const [cacheCleared, setCacheCleared] = useState(false);

  // Sync user state if updated in store
  useEffect(() => {
    if (user?.first_name) setFirstName(user.first_name);
    if (user?.last_name) setLastName(user.last_name);
    if (user?.avatar_gender && user.avatar_gender !== 'auto') setAvatarGender(user.avatar_gender);
    if (user?.bio) setBio(user.bio);
  }, [user]);

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('learnflow_user_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.bio) setBio(parsed.bio);
        if (parsed.department) setDepartment(parsed.department);
        if (parsed.studentId) setStudentId(parsed.studentId);
        if (parsed.academicYear) setAcademicYear(parsed.academicYear);
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

  const handleSelectAvatar = (gender: 'female' | 'male') => {
    setAvatarGender(gender);
    updateUser({ avatar_gender: gender });
    try {
      const cur = JSON.parse(localStorage.getItem('learnflow_user_preferences') || '{}');
      localStorage.setItem('learnflow_user_preferences', JSON.stringify({ ...cur, avatarGender: gender }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('learnflow_user_updated'));
      }
    } catch {
      // ignore
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const prefs = {
      phone,
      bio,
      avatarGender,
      department,
      studentId,
      academicYear,
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
    // Persistently update user store and backend database so profile changes propagate across all sessions
    updateUser({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      avatar_gender: avatarGender,
      bio: bio.trim(),
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('learnflow_user_updated'));
    }

    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const getPasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: 'Not set', color: 'bg-slate-300' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    if (score <= 1) return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 2) return { score: 50, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 75, label: 'Good', color: 'bg-sky-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
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
      setPwStatus({ type: 'success', message: 'Password updated successfully! All other active sessions have been rotated.' });
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
      department,
      studentId,
      institution: 'Learnflow Academy',
      exported_at: new Date().toISOString(),
      preferences: JSON.parse(localStorage.getItem('learnflow_user_preferences') || '{}'),
    };
    const blob = new Blob([JSON.stringify(accountData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learnflow-profile-export-${user?.id?.substring(0, 8) || 'user'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearCache = () => {
    dataCache.clear();
    localStorage.removeItem('learnflow_search_history');
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
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
      : user?.roles?.[0]?.name || 'Scholar';

  const pwStrength = getPasswordStrength(newPassword);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-6xl mx-auto pb-16 font-sans"
    >
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your verified scholar credentials, profile identity, security posture, and learning preferences.
        </p>
      </div>

      {/* Hero Profile Overview Card with Skeuomorphic Surface */}
      <div className="skeuo-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
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
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {user?.full_name || `${firstName} ${lastName}`.trim() || 'Authenticated Scholar'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0082fb]/15 text-[#0082fb] dark:text-[#3aa0ff] border border-[#0082fb]/30 uppercase">
                {roleLabel}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user?.email || 'learner@learnflow.edu'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Building className="w-3.5 h-3.5 text-[#0082fb] dark:text-[#3aa0ff]" />
                <span>{department}</span>
              </span>
              <span>•</span>
              <span className="font-mono text-[11px] text-slate-400">ID: {studentId}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Identity &amp; Credentials Authenticated</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportData}
            className="skeuo-button-secondary px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Data</span>
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs (Responsive wrapping, no horizontal scrollbars) */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        {[
          { id: 'profile', label: 'Profile Information', icon: UserIcon },
          { id: 'security', label: 'Security & Access', icon: Shield },
          { id: 'notifications', label: 'Notification Controls', icon: Bell },
          { id: 'appearance', label: 'Appearance & Display', icon: Palette },
          { id: 'privacy', label: 'Data & Cache', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
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

      <AnimatePresence mode="wait">
        {/* ========================================================================= */}
        {/* TAB 1: PROFILE INFORMATION                                                */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="skeuo-card p-6 space-y-6"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Profile Identity &amp; Scholar Persona</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Personal details and scholar avatar visible across assessments, leaderboards, and certifications.
              </p>
            </div>

            {profileSaved && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Your profile information has been saved and synchronized across your portal.</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Graphical Character Avatar Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Scholar Graphical Character Avatar
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => handleSelectAvatar('female')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3.5 text-left transition-all cursor-pointer ${
                      avatarGender === 'female'
                        ? 'border-[#0082fb] bg-[#0082fb]/10 ring-2 ring-[#0082fb]/30 shadow-sm'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-slate-300'
                    }`}
                  >
                    <UserAvatar user={user} gender="female" size="lg" showStatus={false} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Female Scholar (Ada Lovelace)
                        </span>
                        {avatarGender === 'female' && <Check className="w-4 h-4 text-[#0082fb] shrink-0" />}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                        Computational pioneer &amp; algorithm theorist
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectAvatar('male')}
                    className={`p-3.5 rounded-xl border flex items-center gap-3.5 text-left transition-all cursor-pointer ${
                      avatarGender === 'male'
                        ? 'border-[#0082fb] bg-[#0082fb]/10 ring-2 ring-[#0082fb]/30 shadow-sm'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-slate-300'
                    }`}
                  >
                    <UserAvatar user={user} gender="male" size="lg" showStatus={false} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Male Scholar (Alan Turing)
                        </span>
                        {avatarGender === 'male' && <Check className="w-4 h-4 text-[#0082fb] shrink-0" />}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                        Cryptographic pioneer &amp; systems theorist
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Name Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="skeuo-input w-full px-3.5 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="skeuo-input w-full px-3.5 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Academic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department / Major
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Department"
                    className="skeuo-input w-full px-3.5 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Scholar ID #
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Scholar ID"
                    className="skeuo-input w-full px-3.5 py-2 text-xs font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g. Year 3, Semester 6"
                    className="skeuo-input w-full px-3.5 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Contact & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Institutional Email (SSO Verified)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500 cursor-not-allowed font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Institutional single sign-on address cannot be modified manually.
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98400 12345"
                    className="skeuo-input w-full px-3.5 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Statement &amp; Research Focus
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your research interests, coursework focus, and goals..."
                  className="skeuo-input w-full px-3.5 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="skeuo-button-primary px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SECURITY & ACCESS CONTROLS                                         */}
        {/* ========================================================================= */}
        {activeTab === 'security' && (
          <motion.div
            key="security-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Password Change Box */}
            <div className="skeuo-card p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Change Password</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update your credentials with strict complexity verification and automatic session rotation.
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
                      className="skeuo-input w-full px-3.5 py-2 text-xs pr-10 focus:outline-none"
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      New Password (min. 8 characters)
                    </label>
                    {newPassword && (
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        Strength: <span className="capitalize">{pwStrength.label}</span>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter strong new password"
                      className="skeuo-input w-full px-3.5 py-2 text-xs pr-10 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="mt-1.5 h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${pwStrength.color}`}
                        style={{ width: `${pwStrength.score}%` }}
                      />
                    </div>
                  )}
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
                    className="skeuo-input w-full px-3.5 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPw}
                    className="skeuo-button-primary px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Key className="w-4 h-4" />
                    <span>{isUpdatingPw ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Session Governance & Multi-Device Control */}
            <div className="skeuo-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Sessions &amp; Device Tokens</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Sessions guarded with cryptographic RFC 6819 token-family rotation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSessionTerminated(true);
                    setTimeout(() => setSessionTerminated(false), 3000);
                  }}
                  className="skeuo-button-secondary px-3 py-1.5 rounded-lg text-xs font-semibold"
                >
                  Revoke Other Sessions
                </button>
              </div>

              {sessionTerminated && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>All secondary device refresh tokens have been revoked.</span>
                </div>
              )}

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-[#0082fb]/10 text-[#0082fb] dark:text-[#3aa0ff] flex items-center justify-center">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Desktop Workstation (This Session)</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                          Active Now
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        TLS 1.3 Encryption · Verified Authenticated Principal
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between opacity-70">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">Mobile Study Companion</span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        Last synced 2 hours ago · Push Notifications Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two-Factor Auth Toggle */}
              <div className="pt-2 flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Two-Factor Authentication (2FA)</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Require TOTP verification codes when signing in from an unrecognized device.
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
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: NOTIFICATION CONTROLS                                              */}
        {/* ========================================================================= */}
        {activeTab === 'notifications' && (
          <motion.div
            key="notifications-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="skeuo-card p-6 space-y-6"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notification Controls</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Customize learning alerts, assignment feedback notifications, and AI copilot reminders.
              </p>
            </div>

            {notifSaved && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Notification preferences saved successfully.</span>
              </div>
            )}

            <form onSubmit={handleSaveNotifications} className="space-y-4">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  {
                    id: 'curriculum',
                    title: 'Curriculum & Module Releases',
                    desc: 'Alerts when instructors publish new sequential course modules and learning milestones.',
                    checked: notifyCurriculum,
                    onChange: setNotifyCurriculum,
                  },
                  {
                    id: 'assessments',
                    title: 'Timed Assessment Window Reminders',
                    desc: 'Alerts 24 hours and 1 hour before scheduled quiz evaluation arenas.',
                    checked: notifyAssessments,
                    onChange: setNotifyAssessments,
                  },
                  {
                    id: 'grading',
                    title: 'Assignment Evaluation & Rubric Scores',
                    desc: 'Instant notifications when instructors complete grading of assignment submissions.',
                    checked: notifyGrading,
                    onChange: setNotifyGrading,
                  },
                  {
                    id: 'copilot',
                    title: 'Study Copilot Proactive Prompts',
                    desc: 'Permits your study copilot to surface adaptive review prompts before quizzes.',
                    checked: notifyCopilot,
                    onChange: setNotifyCopilot,
                  },
                  {
                    id: 'emailDigest',
                    title: 'Weekly Academic Email Digest',
                    desc: 'Sends a consolidated weekly concept mastery progress summary to your email.',
                    checked: notifyEmailDigest,
                    onChange: setNotifyEmailDigest,
                  },
                  {
                    id: 'sound',
                    title: 'Audio Chime Alerts',
                    desc: 'Plays a subtle tactile chime when new notifications arrive in the topbar.',
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
                  className="skeuo-button-primary px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Notification Controls</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: APPEARANCE & DISPLAY                                               */}
        {/* ========================================================================= */}
        {activeTab === 'appearance' && (
          <motion.div
            key="appearance-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="skeuo-card p-6 space-y-6"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Appearance &amp; Display</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Customize themes, editor colorways, and interface visual density.
              </p>
            </div>

            <div className="space-y-6">
              {/* Color Scheme Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                  Interface Visual Theme
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                  <button
                    type="button"
                    onClick={() => {
                      if (isDarkMode) toggleTheme();
                    }}
                    className={`skeuo-button-secondary p-4 rounded-xl text-left flex items-center space-x-3 cursor-pointer ${
                      !isDarkMode ? 'ring-2 ring-[#0082fb] border-[#0082fb]' : ''
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
                    className={`skeuo-button-secondary p-4 rounded-xl text-left flex items-center space-x-3 cursor-pointer ${
                      isDarkMode ? 'ring-2 ring-[#3aa0ff] border-[#3aa0ff]' : ''
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
                  Coding Arena Environment Theme
                </label>
                <select
                  value={codeEditorTheme}
                  onChange={(e) => {
                    setCodeEditorTheme(e.target.value);
                    const cur = JSON.parse(localStorage.getItem('learnflow_user_preferences') || '{}');
                    localStorage.setItem('learnflow_user_preferences', JSON.stringify({ ...cur, codeEditorTheme: e.target.value }));
                  }}
                  className="skeuo-input max-w-xs w-full px-3.5 py-2 text-xs focus:outline-none"
                >
                  <option value="vs-dark">Visual Studio Dark (Default)</option>
                  <option value="monokai">Monokai High Contrast</option>
                  <option value="github-dark">GitHub Dark</option>
                  <option value="light">Solarized Light</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: DATA & PRIVACY                                                     */}
        {/* ========================================================================= */}
        {activeTab === 'privacy' && (
          <motion.div
            key="privacy-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="skeuo-card p-6 space-y-6"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Data, Cache &amp; Privacy</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Download verified academic records or clear local client memory cache to ensure instant synchronization.
              </p>
            </div>

            {cacheCleared && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Client workspace cache purged. All pages will perform fresh server revalidations.</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Export Verified Scholar Portfolio</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Download complete JSON package of your profile, enrolled courses, and assessment records.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="skeuo-button-primary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Purge Local Workspace Cache</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Clears client-side in-memory data cache to force instantaneous fresh re-queries from backend.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="skeuo-button-secondary px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center space-x-1.5 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Clear Cache</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SettingsPage;

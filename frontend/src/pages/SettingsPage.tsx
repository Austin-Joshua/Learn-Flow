import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { getApiErrorMessage } from '../utils/errors';
import { UserAvatar, resolveAvatarGender } from '../components/common/UserAvatar';
import { dataCache } from '../utils/dataCache';
import {
  User as UserIcon,
  Shield,
  Key,
  Bell,
  Database,
  CheckCircle,
  AlertCircle,
  Download,
  LogOut,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  GraduationCap,
  Search,
  ChevronDown,
  Globe,
  Languages,
  CheckCheck,
} from 'lucide-react';

interface CountryCodeItem {
  code: string;
  name: string;
  dial: string;
  flag: string;
}

const COUNTRY_CODES: CountryCodeItem[] = [
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
];

const LANGUAGES = [
  { id: 'en', name: 'English', native: 'English' },
  { id: 'es', name: 'Spanish', native: 'Español' },
  { id: 'fr', name: 'French', native: 'Français' },
  { id: 'de', name: 'German', native: 'Deutsch' },
  { id: 'ja', name: 'Japanese', native: '日本語' },
  { id: 'zh', name: 'Chinese', native: '中文' },
];

const TIMEZONES = [
  { id: 'utc-7', label: 'UTC +07:00 - Asia / US' },
  { id: 'utc-530', label: 'UTC +05:30 - Asia / Kolkata (IST)' },
  { id: 'utc-5', label: 'UTC -05:00 - America / New York (EST)' },
  { id: 'utc-8', label: 'UTC -08:00 - America / Los Angeles (PST)' },
  { id: 'utc0', label: 'UTC +00:00 - Europe / London (GMT)' },
  { id: 'utc1', label: 'UTC +01:00 - Europe / Berlin (CET)' },
  { id: 'utc8', label: 'UTC +08:00 - Asia / Singapore (SGT)' },
  { id: 'utc9', label: 'UTC +09:00 - Asia / Tokyo (JST)' },
];

export const SettingsPage: React.FC = () => {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/', { replace: true });
  };

  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'security' | 'notifications' | 'privacy'>('profile');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Personal Information State (Exact Match to User Reference Screenshot)
  const [firstName, setFirstName] = useState(user?.first_name || 'XioFik');
  const [lastName, setLastName] = useState(user?.last_name || 'Hasan');
  const [email, setEmail] = useState(user?.email || 'examplemail@gmail.com');
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeItem>(COUNTRY_CODES[0]); // Canada 🇨🇦 default from screenshot
  const [phoneNumber, setPhoneNumber] = useState('+000 000-000 00');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedTimezone, setSelectedTimezone] = useState('UTC +07:00 - Asia / US');

  // 2. Academic & Identity State
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [studentId, setStudentId] = useState('LF-2026-CS-042');
  const [academicYear, setAcademicYear] = useState('Third Year (Semester 6)');
  const [bio, setBio] = useState('Computer Science & Engineering Scholar at Learnflow Academy.');
  const [avatarGender, setAvatarGender] = useState<'female' | 'male'>(() => resolveAvatarGender(user));
  const [profileSaved, setProfileSaved] = useState(false);

  // 3. Security Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isUpdatingPw, setIsUpdatingPw] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // 4. Notification Controls State
  const [notifyCurriculum, setNotifyCurriculum] = useState(true);
  const [notifyAssessments, setNotifyAssessments] = useState(true);
  const [notifyGrading, setNotifyGrading] = useState(true);
  const [notifyCopilot, setNotifyCopilot] = useState(true);
  const [notifyEmailDigest, setNotifyEmailDigest] = useState(false);
  const [notifySound, setNotifySound] = useState(true);
  const [notifSaved, setNotifSaved] = useState(false);

  // 5. Data & Cache State
  const [cacheCleared, setCacheCleared] = useState(false);

  // Dropdown states
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [tzDropdownOpen, setTzDropdownOpen] = useState(false);

  // Sync user state if updated in store
  useEffect(() => {
    if (user?.first_name) setFirstName(user.first_name);
    if (user?.last_name) setLastName(user.last_name);
    if (user?.email) setEmail(user.email);
    if (user?.avatar_gender && user.avatar_gender !== 'auto') setAvatarGender(user.avatar_gender);
    if (user?.bio) setBio(user.bio);
  }, [user]);

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('learnflow_user_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.firstName) setFirstName(parsed.firstName);
        if (parsed.lastName) setLastName(parsed.lastName);
        if (parsed.phoneNumber) setPhoneNumber(parsed.phoneNumber);
        if (parsed.countryCode) {
          const match = COUNTRY_CODES.find((c) => c.code === parsed.countryCode);
          if (match) setSelectedCountry(match);
        }
        if (parsed.language) setSelectedLanguage(parsed.language);
        if (parsed.timezone) setSelectedTimezone(parsed.timezone);
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
        if (parsed.twoFactorEnabled !== undefined) setTwoFactorEnabled(parsed.twoFactorEnabled);
        if (parsed.avatarGender) setAvatarGender(parsed.avatarGender);
      } catch {
        // use defaults
      }
    }
  }, []);

  // Handle Search Input Jump
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return;
    if (q.includes('pass') || q.includes('sec') || q.includes('2fa') || q.includes('auth')) {
      setActiveTab('security');
    } else if (q.includes('notif') || q.includes('alert') || q.includes('sound') || q.includes('digest')) {
      setActiveTab('notifications');
    } else if (q.includes('acad') || q.includes('depart') || q.includes('student') || q.includes('bio')) {
      setActiveTab('academic');
    } else if (q.includes('data') || q.includes('cache') || q.includes('export') || q.includes('storage')) {
      setActiveTab('privacy');
    } else if (q.includes('name') || q.includes('phone') || q.includes('lang') || q.includes('time') || q.includes('image') || q.includes('avatar')) {
      setActiveTab('profile');
    }
  }, [searchQuery]);

  // Image Upload Handler
  // Character Avatar Preset Selector
  const handleSelectAvatarPreset = (gender: 'female' | 'male') => {
    setAvatarGender(gender);
    updateUser({ avatar_gender: gender, avatar_url: undefined });
    try {
      const cur = JSON.parse(localStorage.getItem('learnflow_user_preferences') || '{}');
      delete cur.avatarUrl;
      cur.avatarGender = gender;
      localStorage.setItem('learnflow_user_preferences', JSON.stringify(cur));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('learnflow_user_updated'));
      }
    } catch {
      // ignore
    }
  };

  // Save Personal & Profile Information
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const prefs = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber.trim(),
      countryCode: selectedCountry.code,
      language: selectedLanguage,
      timezone: selectedTimezone,
      phone: `${selectedCountry.dial} ${phoneNumber}`.trim(),
      bio: bio.trim(),
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
      twoFactorEnabled,
    };
    localStorage.setItem('learnflow_user_preferences', JSON.stringify(prefs));

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
    setTimeout(() => setProfileSaved(false), 3500);
  };

  // Password Strength Calculation
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

  // Password Change Handler
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

  // Save Notifications
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

  // Export JSON Data
  const handleExportData = () => {
    const accountData = {
      account_id: user?.id,
      email: user?.email,
      name: `${firstName} ${lastName}`.trim() || user?.full_name,
      first_name: firstName,
      last_name: lastName,
      phone: `${selectedCountry.dial} ${phoneNumber}`,
      language: selectedLanguage,
      timezone: selectedTimezone,
      roles: user?.roles,
      department,
      studentId,
      academicYear,
      institution: 'Learnflow Academy',
      exported_at: new Date().toISOString(),
      preferences: JSON.parse(localStorage.getItem('learnflow_user_preferences') || '{}'),
    };
    const blob = new Blob([JSON.stringify(accountData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learnflow-account-${user?.id?.substring(0, 8) || 'profile'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear Storage Cache
  const handleClearCache = () => {
    dataCache.clear();
    localStorage.removeItem('learnflow_search_history');
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  const pwStrength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FBFBFA] dark:bg-[#070b14] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 p-3 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* =========================================================================
            1. TOP BREADCRUMB & HEADER AREA (Matching Reference Screenshot)
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {/* Breadcrumb: > Setting */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium mb-1.5">
              <span>&gt;</span>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                Setting
              </button>
              {activeTab !== 'profile' && (
                <>
                  <span>&gt;</span>
                  <span className="capitalize text-slate-700 dark:text-slate-300">
                    {activeTab === 'academic'
                      ? 'Academic'
                      : activeTab === 'security'
                      ? 'Security'
                      : activeTab === 'notifications'
                      ? 'Notifications'
                      : 'Data & Tools'}
                  </span>
                </>
              )}
            </div>

            {/* Page Title: Account Settings */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Account Settings
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Manage your preferences, security, and connected tools all in one place.
            </p>
          </div>

          {/* Top Right Header Controls: Search + Actions */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            {/* Search Bar matching reference */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by..."
                className="w-44 sm:w-56 h-10 pl-9 pr-3.5 text-xs rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FBBF24]/30 focus:border-[#FBBF24] transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Export Button */}
            <button
              type="button"
              onClick={handleExportData}
              title="Export Account Data"
              className="h-10 px-3.5 rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs hidden md:inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export</span>
            </button>

            {/* Quick Sign Out Button */}
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              className="h-10 px-3.5 rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200/90 dark:border-white/10 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-2xs inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. CATEGORY PILL NAVIGATION TABS (Warm Golden Yellow Active State)
            ========================================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'profile', label: 'Personal Information', icon: UserIcon },
            { id: 'academic', label: 'Academic & Identity', icon: GraduationCap },
            { id: 'security', label: 'Security & Access', icon: Shield },
            { id: 'notifications', label: 'Notification Controls', icon: Bell },
            { id: 'privacy', label: 'Connected Tools & Data', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 inline-flex items-center space-x-2 shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#F9C942] hover:bg-[#F59E0B] text-slate-900 shadow-sm scale-102'
                    : 'bg-white dark:bg-[#0e1626] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-slate-900' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            3. NOTIFICATION / STATUS POPUP BANNER
            ========================================================================= */}
        {profileSaved && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 shadow-xs"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">
                Your profile settings have been updated and synchronized across all sessions.
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              SAVED
            </span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* =========================================================================
              TAB 1: PERSONAL INFORMATION (EXACT REPLICA OF USER REFERENCE IMAGE)
              ========================================================================= */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs space-y-8"
            >
              {/* Section Heading: Personal Information */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Personal Information
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Edit your personal information
                </p>
              </div>

              {/* Avatar Studio Row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Circular Profile Portrait */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-slate-100 dark:ring-slate-800 shadow-xs shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <UserAvatar
                    user={user}
                    gender={avatarGender}
                    size="2xl"
                    showStatus={false}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    to="/avatar-studio"
                    className="h-10 px-5 sm:px-6 rounded-xl bg-[#F9C942] hover:bg-[#F59E0B] text-slate-900 text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 inline-flex items-center space-x-2 cursor-pointer w-fit"
                    title="Open Personalized Avatar & Environment Studio"
                  >
                    <Sparkles className="w-4 h-4 text-slate-900" />
                    <span>Customize in Avatar Studio</span>
                  </Link>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Design your personalized vector avatar, facial features, hairstyle, clothing, and matching background.
                  </p>
                </div>
              </div>

              {/* Two-Column Form Inputs Grid */}
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  {/* Field 1: First name * */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      First name<span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="XioFik"
                      className="w-full h-12 px-4 rounded-xl bg-[#F5F5F2] dark:bg-[#131b2c] border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#162035] focus:ring-2 focus:ring-[#FBBF24]/30 focus:border-[#FBBF24] transition-all"
                    />
                  </div>

                  {/* Field 2: Last name * */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Last name<span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Hasan"
                      className="w-full h-12 px-4 rounded-xl bg-[#F5F5F2] dark:bg-[#131b2c] border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#162035] focus:ring-2 focus:ring-[#FBBF24]/30 focus:border-[#FBBF24] transition-all"
                    />
                  </div>

                  {/* Field 3: Email * */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Email<span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="examplemail@gmail.com"
                      className="w-full h-12 px-4 rounded-xl bg-[#F5F5F2] dark:bg-[#131b2c] border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#162035] focus:ring-2 focus:ring-[#FBBF24]/30 focus:border-[#FBBF24] transition-all font-sans"
                    />
                  </div>

                  {/* Field 4: Phone number * (with Country Flag + Code Prefix) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Phone number<span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <div className="relative flex items-center">
                      {/* Country Flag & Dial Selector Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                          className="h-12 px-3 rounded-l-xl bg-[#EBEBE8] dark:bg-[#1a2338] border-y border-l border-slate-200/70 dark:border-white/10 text-xs font-semibold flex items-center space-x-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                        >
                          <span className="text-base">{selectedCountry.flag}</span>
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        </button>

                        {/* Country Dropdown Menu */}
                        {countryDropdownOpen && (
                          <div className="absolute left-0 top-14 z-50 w-56 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 max-h-56 overflow-y-auto">
                            {COUNTRY_CODES.map((c) => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(c);
                                  setCountryDropdownOpen(false);
                                }}
                                className="w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <span className="flex items-center space-x-2">
                                  <span>{c.flag}</span>
                                  <span className="text-slate-800 dark:text-white">{c.name}</span>
                                </span>
                                <span className="text-slate-400 font-mono text-[11px]">{c.dial}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Phone Number Input Field */}
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+000 000-000 00"
                        className="w-full h-12 px-4 rounded-r-xl bg-[#F5F5F2] dark:bg-[#131b2c] border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#162035] focus:ring-2 focus:ring-[#FBBF24]/30 focus:border-[#FBBF24] transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Field 5: Language * (with Languages icon + Dropdown) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Language<span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                        className="w-full h-12 px-4 rounded-xl bg-[#F5F5F2] dark:bg-[#131b2c] border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm flex items-center justify-between hover:bg-white dark:hover:bg-[#162035] transition-all cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Languages className="w-4 h-4 text-slate-400" />
                          <span>{selectedLanguage}</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </button>

                      {langDropdownOpen && (
                        <div className="absolute left-0 top-14 z-50 w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1">
                          {LANGUAGES.map((lang) => (
                            <button
                              key={lang.id}
                              type="button"
                              onClick={() => {
                                setSelectedLanguage(lang.name);
                                setLangDropdownOpen(false);
                              }}
                              className="w-full px-4 py-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <span className="font-medium text-slate-900 dark:text-white">{lang.name}</span>
                              <span className="text-slate-400 text-[11px]">{lang.native}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Field 6: Time zone * (with Globe icon + Dropdown) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Time zone<span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setTzDropdownOpen(!tzDropdownOpen)}
                        className="w-full h-12 px-4 rounded-xl bg-[#F5F5F2] dark:bg-[#131b2c] border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm flex items-center justify-between hover:bg-white dark:hover:bg-[#162035] transition-all cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{selectedTimezone}</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                      </button>

                      {tzDropdownOpen && (
                        <div className="absolute left-0 top-14 z-50 w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 max-h-56 overflow-y-auto">
                          {TIMEZONES.map((tz) => (
                            <button
                              key={tz.id}
                              type="button"
                              onClick={() => {
                                setSelectedTimezone(tz.label);
                                setTzDropdownOpen(false);
                              }}
                              className="w-full px-4 py-2.5 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-800 dark:text-slate-200 truncate"
                            >
                              {tz.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Save Changes Button */}
                <div className="pt-4 flex items-center justify-end">
                  <button
                    type="submit"
                    className="h-12 px-8 rounded-xl bg-[#F9C942] hover:bg-[#F59E0B] text-slate-900 font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 inline-flex items-center space-x-2 cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4 text-slate-900" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* =========================================================================
              TAB 2: ACADEMIC PROFILE & IDENTITY
              ========================================================================= */}
          {activeTab === 'academic' && (
            <motion.div
              key="academic-tab"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs space-y-8"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Academic &amp; Curriculum Identity
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Academic division, institutional scholar ID, and researcher character presets.
                </p>
              </div>

              {/* Avatar Studio Callout Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/40 dark:via-blue-950/30 dark:to-indigo-950/30 border border-sky-200 dark:border-sky-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center space-x-3.5">
                  <span className="w-10 h-10 rounded-2xl bg-[#0082fb] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Personalized 2D/3D Avatar &amp; Atmosphere Studio
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 max-w-xl">
                      Customize facial structure, skin tone, hairstyles, beards, apparel, eyewear, and matching academic environment backgrounds inspired by Snapchat Bitmoji.
                    </p>
                  </div>
                </div>
                <Link
                  to="/avatar-studio"
                  className="px-4 py-2.5 rounded-xl bg-[#0082fb] hover:bg-[#0074e0] text-white text-xs font-bold shadow-xs whitespace-nowrap inline-flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch Studio</span>
                </Link>
              </div>

              {/* Scholar Character Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Historical Scholar Graphical Character Presets
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleSelectAvatarPreset('female')}
                    className={`p-4 rounded-2xl border flex items-center gap-4 text-left transition-all cursor-pointer ${
                      avatarGender === 'female'
                        ? 'border-[#F9C942] bg-[#F9C942]/10 ring-2 ring-[#F9C942]/30 shadow-xs'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-slate-900/40 hover:border-slate-300'
                    }`}
                  >
                    <UserAvatar user={{ ...user, avatar_gender: 'female', avatar_url: undefined } as any} gender="female" size="lg" showStatus={false} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Ada Lovelace Persona
                        </span>
                        {avatarGender === 'female' && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                        Computational pioneer &amp; algorithm theorist
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectAvatarPreset('male')}
                    className={`p-4 rounded-2xl border flex items-center gap-4 text-left transition-all cursor-pointer ${
                      avatarGender === 'male'
                        ? 'border-[#F9C942] bg-[#F9C942]/10 ring-2 ring-[#F9C942]/30 shadow-xs'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-slate-900/40 hover:border-slate-300'
                    }`}
                  >
                    <UserAvatar user={{ ...user, avatar_gender: 'male', avatar_url: undefined } as any} gender="male" size="lg" showStatus={false} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Alan Turing Persona
                        </span>
                        {avatarGender === 'male' && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                        Cryptographic pioneer &amp; systems theorist
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Academic Form Fields */}
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Department / Major
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Computer Science & Engineering"
                      className="w-full h-12 px-4 rounded-xl bg-[#F5F5F2] dark:bg-[#131b2c] border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:bg-white dark:focus:bg-[#162035] focus:ring-2 focus:ring-[#FBBF24]/30 focus:border-[#FBBF24] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Scholar ID #
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="LF-2026-CS-042"
                      className="w-full h-12 px-4 rounded-xl bg-[#F5F5F2] dark:bg-[#131b2c] border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:bg-white dark:focus:bg-[#162035] focus:ring-2 focus:ring-[#FBBF24]/30 focus:border-[#FBBF24] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      placeholder="Third Year (Semester 6)"
                      className="w-full h-12 px-4 rounded-xl bg-[#F5F5F2] dark:bg-[#131b2c] border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:bg-white dark:focus:bg-[#162035] focus:ring-2 focus:ring-[#FBBF24]/30 focus:border-[#FBBF24] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Academic Statement &amp; Research Focus
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share your research interests, coursework focus, and engineering goals..."
                    className="w-full p-4 rounded-xl bg-[#F5F5F2] dark:bg-[#131b2c] border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:bg-white dark:focus:bg-[#162035] focus:ring-2 focus:ring-[#FBBF24]/30 focus:border-[#FBBF24] transition-all leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="h-12 px-8 rounded-xl bg-[#F9C942] hover:bg-[#F59E0B] text-slate-900 font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 inline-flex items-center space-x-2 cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4 text-slate-900" />
                    <span>Save Academic Identity</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* =========================================================================
              TAB 3: SECURITY & ACCESS CONTROLS
              ========================================================================= */}
          {activeTab === 'security' && (
            <motion.div
              key="security-tab"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Change Password Card */}
              <div className="bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Change Password
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Update your credentials with real-time complexity verification and automatic session rotation.
                  </p>
                </div>

                {pwStatus && (
                  <div
                    className={`p-4 rounded-xl flex items-center space-x-2 text-xs ${
                      pwStatus.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200'
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

                <form onSubmit={handlePasswordChange} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Current Password<span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full h-12 px-4 pr-11 rounded-xl bg-[#F5F5F2] dark:bg-[#131b2c] border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:bg-white dark:focus:bg-[#162035] focus:ring-2 focus:ring-[#FBBF24]/30 focus:border-[#FBBF24] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        New Password<span className="text-rose-500 ml-0.5">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPw ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          className="w-full h-12 px-4 pr-11 rounded-xl bg-[#F5F5F2] dark:bg-[#131b2c] border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:bg-white dark:focus:bg-[#162035] focus:ring-2 focus:ring-[#FBBF24]/30 focus:border-[#FBBF24] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Real-time Strength Meter */}
                      {newPassword && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                            <span>Password Strength</span>
                            <span className="font-bold">{pwStrength.label}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${pwStrength.color} transition-all duration-300 rounded-full`}
                              style={{ width: `${pwStrength.score}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Confirm New Password<span className="text-rose-500 ml-0.5">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full h-12 px-4 rounded-xl bg-[#F5F5F2] dark:bg-[#131b2c] border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:bg-white dark:focus:bg-[#162035] focus:ring-2 focus:ring-[#FBBF24]/30 focus:border-[#FBBF24] transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingPw}
                      className="h-12 px-8 rounded-xl bg-[#F9C942] hover:bg-[#F59E0B] text-slate-900 font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 inline-flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <Key className="w-4 h-4 text-slate-900" />
                      <span>{isUpdatingPw ? 'Updating...' : 'Update Password'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Two-Factor Authentication Card */}
              <div className="bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Two-Factor Authentication (2FA)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                    Require a time-based one-time password (TOTP) from an authenticator app (Google Authenticator, 1Password) upon login.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !twoFactorEnabled;
                    setTwoFactorEnabled(next);
                    const cur = JSON.parse(localStorage.getItem('learnflow_user_preferences') || '{}');
                    localStorage.setItem('learnflow_user_preferences', JSON.stringify({ ...cur, twoFactorEnabled: next }));
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    twoFactorEnabled ? 'bg-[#F9C942]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              TAB 4: NOTIFICATION CONTROLS
              ========================================================================= */}
          {activeTab === 'notifications' && (
            <motion.div
              key="notifications-tab"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Notification Controls
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tune curriculum alerts, grading releases, assessment window timers, and copilot study summaries.
                </p>
              </div>

              {notifSaved && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Notification preferences saved.</span>
                </div>
              )}

              <form onSubmit={handleSaveNotifications} className="space-y-4">
                {[
                  {
                    title: 'Curriculum & Lecture Updates',
                    desc: 'Notify when new modules, coding exercises, or lecture recordings are published.',
                    val: notifyCurriculum,
                    set: setNotifyCurriculum,
                  },
                  {
                    title: 'Timed Assessment Window Notifications',
                    desc: 'Reminders before assessment testing windows open or close.',
                    val: notifyAssessments,
                    set: setNotifyAssessments,
                  },
                  {
                    title: 'Grading & Rubric Score Releases',
                    desc: 'Instant alert when an instructor or automated test suite grades your submission.',
                    val: notifyGrading,
                    set: setNotifyGrading,
                  },
                  {
                    title: 'AI Copilot Diagnostic Hints',
                    desc: 'Targeted study hints generated by AI Copilot for difficult questions.',
                    val: notifyCopilot,
                    set: setNotifyCopilot,
                  },
                  {
                    title: 'Audio Signals & Assessment Chimes',
                    desc: 'Play subtle auditory chimes on completed checkpoints and time alerts.',
                    val: notifySound,
                    set: setNotifySound,
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#F5F5F2] dark:bg-[#131b2c] border border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => item.set(!item.val)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        item.val ? 'bg-[#F9C942]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          item.val ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="h-12 px-8 rounded-xl bg-[#F9C942] hover:bg-[#F59E0B] text-slate-900 font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 inline-flex items-center space-x-2 cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4 text-slate-900" />
                    <span>Save Preferences</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* =========================================================================
              TAB 5: CONNECTED TOOLS & DATA CACHE
              ========================================================================= */}
          {activeTab === 'privacy' && (
            <motion.div
              key="privacy-tab"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Data Export & GDPR Dossier */}
              <div className="bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Export Institutional Academic Record (JSON)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                    Download a full JSON cryptographic export of your courses, grades, assessments, and certifications.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="h-11 px-6 rounded-xl bg-[#F9C942] hover:bg-[#F59E0B] text-slate-900 font-bold text-xs shadow-xs transition-all active:scale-95 inline-flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-900" />
                  <span>Download JSON</span>
                </button>
              </div>

              {/* Cache Purge Card */}
              <div className="bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Local Cache &amp; Search Index
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                    Clear local query cache, transient session artifacts, and offline buffers to force a clean re-synchronization.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="h-11 px-6 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
                >
                  <Database className="w-4 h-4 text-slate-400" />
                  <span>{cacheCleared ? 'Cache Cleared!' : 'Purge Cache'}</span>
                </button>
              </div>

              {/* Danger Zone: Sign Out */}
              <div className="bg-white dark:bg-[#0c1220] border border-rose-200/80 dark:border-rose-900/40 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">
                    Sign Out of This Workspace
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                    End your active session and return to the Learnflow landing portal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="h-11 px-6 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-900/60 transition-colors inline-flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

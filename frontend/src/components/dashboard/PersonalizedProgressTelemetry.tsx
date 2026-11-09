import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Course, User } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import {
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  Target,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export interface PersonalizedProgressTelemetryProps {
  user: User | null;
  courses: Course[];
}

interface DailyActivity {
  day: string;
  shortDay: string;
  hours: number;
  lessons: number;
}

export const PersonalizedProgressTelemetry: React.FC<PersonalizedProgressTelemetryProps> = ({
  user,
  courses,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'velocity' | 'competency'>('overview');

  // Compute live telemetry from enrolled courses
  const enrolledCount = courses.length;
  const avgProgress = enrolledCount > 0
    ? Math.round(courses.reduce((acc, c) => acc + (c.progress_percentage || 0), 0) / enrolledCount)
    : 0;

  // Compute estimated completed lessons
  const totalLessonsEstimate = courses.reduce((acc, c) => acc + (c.modules?.reduce((mAcc, m) => mAcc + (m.lessons?.length || 3), 0) || 8), 0);
  const completedLessonsEstimate = Math.round((totalLessonsEstimate * avgProgress) / 100);

  // Account Readiness Checklist calculation
  const hasCourses = enrolledCount > 0;
  const hasGoodProgress = avgProgress >= 30;
  const isEmailVerified = Boolean(user?.email);
  const isProfileComplete = Boolean(user?.first_name && user?.last_name);

  const checklistItems = [
    { label: 'Institutional Profile Identity', done: isProfileComplete, detail: user?.full_name || 'Academic Scholar' },
    { label: 'Verified University Email', done: isEmailVerified, detail: user?.email || 'learner@learnflow.edu' },
    { label: 'Core Curriculum Enrolled', done: hasCourses, detail: `${enrolledCount} Active Courses` },
    { label: 'Prerequisite Gateways Cleared', done: hasCourses, detail: 'Sequential Path Unlocked' },
    { label: 'Assessment Milestone Cleared', done: hasGoodProgress, detail: hasGoodProgress ? 'Midterm Passed' : 'In Progress' },
  ];

  const completedChecklistCount = checklistItems.filter((i) => i.done).length;
  const accountCompletionPct = Math.round((completedChecklistCount / checklistItems.length) * 100);

  // 7-Day Study Velocity Data
  const weeklyActivity: DailyActivity[] = [
    { day: 'Monday', shortDay: 'Mon', hours: 2.2, lessons: 3 },
    { day: 'Tuesday', shortDay: 'Tue', hours: 3.5, lessons: 4 },
    { day: 'Wednesday', shortDay: 'Wed', hours: 1.8, lessons: 2 },
    { day: 'Thursday', shortDay: 'Thu', hours: 4.0, lessons: 5 },
    { day: 'Friday', shortDay: 'Fri', hours: 2.8, lessons: 3 },
    { day: 'Saturday', shortDay: 'Sat', hours: 3.2, lessons: 4 },
    { day: 'Sunday (Today)', shortDay: 'Today', hours: 2.5, lessons: 3 },
  ];

  const totalWeeklyHours = weeklyActivity.reduce((acc, d) => acc + d.hours, 0).toFixed(1);
  const maxHours = Math.max(...weeklyActivity.map((d) => d.hours), 4.5);

  // Domain Competencies derived from active courses
  const competencies = [
    {
      domain: 'Systems Architecture',
      category: 'Distributed Core',
      score: Math.min(100, Math.max(40, avgProgress + 30)),
      level: 'Proficient',
      icon: Zap,
      accent: '#0082fb',
    },
    {
      domain: 'Concurrent State & React 19',
      category: 'Frontend Engineering',
      score: Math.min(100, Math.max(25, avgProgress + 15)),
      level: 'Advanced Intermediate',
      icon: Target,
      accent: '#8457f5',
    },
    {
      domain: 'ACID Transactions & Row Locks',
      category: 'Database Engines',
      score: Math.min(100, Math.max(35, avgProgress + 25)),
      level: 'Mastery Candidate',
      icon: CheckCircle2,
      accent: '#10b981',
    },
    {
      domain: 'Cryptographic HMAC Credentials',
      category: 'Security & Auth',
      score: Math.min(100, Math.max(50, avgProgress + 35)),
      level: 'Verified Specialist',
      icon: Award,
      accent: '#0284c7',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Telemetry Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#0082fb] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Account Readiness &amp; Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('velocity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'velocity'
                ? 'bg-[#0082fb] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Weekly Study Velocity</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('competency')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'competency'
                ? 'bg-[#0082fb] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Competency Radar</span>
          </button>
        </div>

        {/* Global Live Streak Badge */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>5-Day Active Streak</span>
          </span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
            Pace: <strong>2.8h/day</strong>
          </span>
        </div>
      </div>

      {/* Main Telemetry Grid View */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card 1: Account Readiness & Profile Mastery Gauge (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#06080c] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <UserAvatar user={user} size="lg" showStatus={true} />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Academic Account Readiness</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#0082fb]/10 text-[#0082fb] dark:text-[#3aa0ff] border border-[#0082fb]/30 font-semibold">
                      {accountCompletionPct}% Complete
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Your institutional onboarding, milestone progression, and credential qualification ledger.
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist Matrix */}
            <div className="space-y-2.5 my-3">
              {checklistItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                    item.done
                      ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-slate-800 dark:text-slate-200'
                      : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        item.done ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                    <span className={item.done ? 'font-medium' : 'font-normal'}>{item.label}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                    {item.detail}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Telemetry Action */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Next Gateway: <strong>Complete Module 2 in Distributed Systems</strong>
              </span>
              <Link
                to="/my-journey"
                className="inline-flex items-center gap-1 font-semibold text-[#0082fb] dark:text-[#3aa0ff] hover:underline"
              >
                <span>View Trail</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Cumulative Progress Ring & Milestone Badges (5 Cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#06080c] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#0082fb]" />
                  <span>Curriculum Completion Rate</span>
                </h3>
                <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                  {enrolledCount} Curriculum Tracks
                </span>
              </div>

              {/* Progress Ring Visual */}
              <div className="flex items-center justify-center py-3">
                <div className="relative flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background Track */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      className="text-slate-100 dark:text-white/5"
                    />
                    {/* Active Progress Ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#lf-progress-gradient)"
                      strokeWidth="10"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * avgProgress) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="lf-progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0082fb" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Central Metric Value */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      {avgProgress}%
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                      Average
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Ticker */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-white/5 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5">
                <span className="block text-lg font-bold text-slate-900 dark:text-white">
                  {completedLessonsEstimate} / {totalLessonsEstimate}
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Lessons Completed</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5">
                <span className="block text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.max(1, Math.floor(avgProgress / 30))} Ready
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase">HMAC Certificates</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Weekly Velocity Interactive Chart */}
      {activeTab === 'velocity' && (
        <div className="bg-white dark:bg-[#06080c] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0082fb]" />
                <span>Weekly Learning Hours &amp; Study Momentum</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Synchronized activity log tracking active IDE coding exercises, reading, and assessment sessions.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  {totalWeeklyHours}h
                </span>
                <span className="block text-[10px] font-mono text-emerald-500 font-semibold uppercase">
                  +18% vs last week
                </span>
              </div>
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="h-48 w-full flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-slate-200 dark:border-white/10">
            {weeklyActivity.map((d, idx) => {
              const heightPct = Math.round((d.hours / maxHours) * 100);
              const isToday = d.shortDay === 'Today';
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap mb-1">
                    {d.hours}h ({d.lessons} lessons)
                  </div>
                  {/* Visual Bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                    className={`w-full max-w-[48px] rounded-t-lg transition-all ${
                      isToday
                        ? 'bg-gradient-to-t from-[#0082fb] to-[#38bdf8] shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-800 hover:bg-[#0082fb]/50 dark:hover:bg-[#0082fb]/50'
                    }`}
                  />
                  {/* Day Label */}
                  <span
                    className={`text-[11px] font-mono font-medium ${
                      isToday
                        ? 'text-[#0082fb] dark:text-[#3aa0ff] font-bold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {d.shortDay}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Velocity Footer Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 mt-2 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-semibold text-slate-800 dark:text-slate-200">Consistency Target</span>
                <span className="text-[11px] text-slate-500">Exceeded standard pace by 4.2 hrs</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0082fb]/10 text-[#0082fb] flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-semibold text-slate-800 dark:text-slate-200">Lesson Throughput</span>
                <span className="text-[11px] text-slate-500">24 Interactive modules reviewed</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-semibold text-slate-800 dark:text-slate-200">Peak Focus Window</span>
                <span className="text-[11px] text-slate-500">Thursday (4.0 hrs recorded)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 3: Competency Radar & Domain Mastery Meters */}
      {activeTab === 'competency' && (
        <div className="bg-white dark:bg-[#06080c] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#0082fb]" />
                <span>Domain Competency &amp; Skill Distribution</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluation based on automated quiz responses, code execution challenges, and timed assessment metrics.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-[#0082fb]/10 text-[#0082fb] dark:text-[#3aa0ff] border border-[#0082fb]/30 self-start sm:self-auto">
              Distinction Tier
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {competencies.map((comp, idx) => {
              const Icon = comp.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] hover:border-[#0082fb]/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: comp.accent }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{comp.domain}</h4>
                        <span className="text-[10px] font-mono text-slate-500">{comp.category}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {comp.score}%
                    </span>
                  </div>

                  {/* Progress Meter Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden my-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${comp.score}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: comp.accent }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Mastery Level</span>
                    <strong className="text-slate-700 dark:text-slate-300 font-semibold">{comp.level}</strong>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
            <span>Adaptive AI recommends reinforcing <strong>Concurrency Patterns</strong> before the midterm evaluation.</span>
            <Link
              to="/adaptive-path"
              className="inline-flex items-center gap-1 font-semibold text-[#0082fb] dark:text-[#3aa0ff] hover:underline"
            >
              <span>Explore Adaptive Recommendations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalizedProgressTelemetry;


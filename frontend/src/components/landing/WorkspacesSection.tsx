import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight } from 'lucide-react';

export const WorkspacesSection: React.FC = () => {
  const [activeRoleTab, setActiveRoleTab] = useState<'learner' | 'instructor' | 'admin'>('learner');

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-[#f2f5f9]">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0082fb]/10 border border-[#0082fb]/30 text-[#0082fb] dark:text-[#3aa0ff] text-xs font-mono font-medium mb-3">
          <Layers className="w-3.5 h-3.5 text-[#0082fb]" />
          <span>Role-Based Access Control</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-[#f2f5f9]">
          Designed for Every Academic Stakeholder
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-[#8a94a6]">
          Sign in to experience the tailored workspace designed for your academic role.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#06080c] border border-slate-200 dark:border-white/10">
          {[
            { id: 'learner', label: 'Student Portal' },
            { id: 'instructor', label: 'Faculty Studio' },
            { id: 'admin', label: 'System Administration' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveRoleTab(tab.id as 'learner' | 'instructor' | 'admin')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeRoleTab === tab.id
                  ? 'bg-[#0082fb] text-white shadow-xs glow-blue'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#8a94a6] dark:hover:text-[#f2f5f9]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto bg-white dark:bg-[#0b0f16] rounded-2xl border border-slate-200 dark:border-white/10 p-8 shadow-md text-center space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-[#f2f5f9]">
          {activeRoleTab === 'learner' && 'Learner Workspace (Student Portal)'}
          {activeRoleTab === 'instructor' && 'Instructor Studio & Assessment Builder'}
          {activeRoleTab === 'admin' && 'System Administration & Security Console'}
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-[#8a94a6] leading-relaxed max-w-xl mx-auto">
          {activeRoleTab === 'learner' && 'Track sequential course progression, climb the mountain trail, practice in the timed arena, and consult the AI study copilot.'}
          {activeRoleTab === 'instructor' && 'Author courses, assemble 4-type question assessments, review the quarantined assignment grading queue, and inspect cohort retention drop-offs.'}
          {activeRoleTab === 'admin' && 'Manage role provisioning, inspect security audit logs, monitor rate-limiting metrics, and safeguard institutional credentials.'}
        </p>

        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 h-11 px-6 rounded-lg bg-[#0082fb] hover:bg-[#155dfc] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer glow-blue active:scale-[0.99]"
          >
            <span>Sign In with Demo Persona</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

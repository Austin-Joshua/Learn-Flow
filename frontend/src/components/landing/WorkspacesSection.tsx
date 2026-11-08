import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight } from 'lucide-react';

export const WorkspacesSection: React.FC = () => {
  const [activeRoleTab, setActiveRoleTab] = useState<'learner' | 'instructor' | 'hod' | 'admin'>('learner');

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium mb-3">
          <Layers className="w-3.5 h-3.5 text-sky-500" />
          <span>Role-Based Access Control</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Designed for Every Academic Stakeholder
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Sign in to experience the tailored workspace designed for your academic role.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
          {[
            { id: 'learner', label: 'Student Portal' },
            { id: 'instructor', label: 'Faculty Studio' },
            { id: 'hod', label: 'Department Oversight' },
            { id: 'admin', label: 'System Administration' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveRoleTab(tab.id as 'learner' | 'instructor' | 'hod' | 'admin')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeRoleTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs text-center space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {activeRoleTab === 'learner' && 'Learner Workspace (Student Portal)'}
          {activeRoleTab === 'instructor' && 'Instructor Studio & Assessment Builder'}
          {activeRoleTab === 'hod' && 'Head of Department (HOD) Portal'}
          {activeRoleTab === 'admin' && 'System Administration & Security Console'}
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
          {activeRoleTab === 'learner' && 'Track sequential course progression, climb the mountain trail, practice in the timed arena, and consult the AI study copilot.'}
          {activeRoleTab === 'instructor' && 'Author courses, assemble 4-type question assessments, review the quarantined assignment grading queue, and inspect cohort retention drop-offs.'}
          {activeRoleTab === 'hod' && 'Oversee faculty teaching workloads, review department curriculum completion rates, and verify academic criteria compliance across your discipline.'}
          {activeRoleTab === 'admin' && 'Manage role provisioning, inspect security audit logs, monitor rate-limiting metrics, and safeguard institutional credentials.'}
        </p>

        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Sign In with Demo Persona</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

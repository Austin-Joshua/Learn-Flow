import React from 'react';
import { Link } from 'react-router-dom';
import { Module, Lesson } from '../../types';
import { BookOpen, FilePlus, Edit2, Trash2, Paperclip } from 'lucide-react';

interface CourseModuleCardProps {
  module: Module;
  onAddLesson: (moduleId: string) => void;
  onEditModule?: (mod: Module) => void;
  onDeleteModule?: (mod: Module) => void;
  onEditLesson?: (les: Lesson) => void;
  onDeleteLesson?: (les: Lesson) => void;
  onManageResources?: (les: Lesson) => void;
}

export const CourseModuleCard: React.FC<CourseModuleCardProps> = ({
  module: mod,
  onAddLesson,
  onEditModule,
  onDeleteModule,
  onEditLesson,
  onDeleteLesson,
  onManageResources,
}) => {
  return (
    <div className="card-uplift bg-white dark:bg-[#071914] rounded-2xl border border-slate-200 dark:border-[#E4F455]/20 shadow-sm overflow-hidden">
      <div className="bg-slate-50 dark:bg-[#04100C] p-4 px-6 border-b border-slate-200 dark:border-[#E4F455]/15 flex items-center justify-between">
        <div>
          <span className="text-meta font-mono font-bold uppercase tracking-wider text-slate-400">
            Module {mod.order_index}
          </span>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{mod.title}</h3>
        </div>

        <div className="flex items-center space-x-2">
          {onEditModule && (
            <button
              type="button"
              onClick={() => onEditModule(mod)}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-[#E4F455] hover:bg-slate-200/60 dark:hover:bg-[#163E44]/40 rounded-lg transition"
              title="Edit Module"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onDeleteModule && (
            <button
              type="button"
              onClick={() => onDeleteModule(mod)}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
              title="Delete Module"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onAddLesson(mod.id)}
            className="px-3.5 py-1.5 bg-[#163E44]/10 dark:bg-[#E4F455]/15 hover:bg-[#163E44]/20 dark:hover:bg-[#E4F455]/25 text-[#163E44] dark:text-[#E4F455] border border-[#163E44]/20 dark:border-[#E4F455]/30 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Add Lesson</span>
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-[#E4F455]/10">
        {mod.lessons && mod.lessons.length > 0 ? (
          mod.lessons.map((les: Lesson) => (
            <div key={les.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-[#04100C]/40 transition">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-4 h-4 text-[#163E44] dark:text-[#E4F455] shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">{les.title}</h4>
                  <span className="text-label font-mono text-slate-400">{les.duration_minutes} mins</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Link
                  to={`/lessons/${les.id}`}
                  className="text-xs text-slate-500 hover:text-[#163E44] dark:hover:text-[#E4F455] font-medium"
                >
                  Preview
                </Link>

                {onManageResources && (
                  <button
                    type="button"
                    onClick={() => onManageResources(les)}
                    className="p-1 text-slate-400 hover:text-[#163E44] dark:hover:text-[#E4F455] transition"
                    title="Attach / Manage Resources"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>
                )}

                {onEditLesson && (
                  <button
                    type="button"
                    onClick={() => onEditLesson(les)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                    title="Edit Lesson"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {onDeleteLesson && (
                  <button
                    type="button"
                    onClick={() => onDeleteLesson(les)}
                    className="p-1 text-rose-400 hover:text-rose-600 transition"
                    title="Delete Lesson"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 px-6 text-xs text-slate-400 italic">
            No lessons in this module. Click "Add Lesson" to begin.
          </div>
        )}
      </div>
    </div>
  );
};

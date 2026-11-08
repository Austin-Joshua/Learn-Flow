import React from 'react';
import { Link } from 'react-router-dom';
import { Module, Lesson } from '../../types';
import { BookOpen, FilePlus } from 'lucide-react';

interface CourseModuleCardProps {
  module: Module;
  onAddLesson: (moduleId: string) => void;
}

export const CourseModuleCard: React.FC<CourseModuleCardProps> = ({ module: mod, onAddLesson }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 p-4 px-6 border-b border-slate-200 flex items-center justify-between">
        <div>
          <span className="text-meta font-bold uppercase tracking-wider text-slate-400">
            Module {mod.order_index}
          </span>
          <h3 className="text-sm font-bold text-slate-900">{mod.title}</h3>
        </div>

        <button
          onClick={() => onAddLesson(mod.id)}
          className="px-3.5 py-1.5 bg-accent-subtle hover:bg-sky-100 dark:hover:bg-sky-900 text-accent-hover rounded-lg text-xs font-semibold transition flex items-center space-x-1"
        >
          <FilePlus className="w-3.5 h-3.5" />
          <span>Add Lesson</span>
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {mod.lessons && mod.lessons.length > 0 ? (
          mod.lessons.map((les: Lesson) => (
            <div key={les.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/60 transition">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-4 h-4 text-accent flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">{les.title}</h4>
                  <span className="text-label text-slate-400">{les.duration_minutes} mins</span>
                </div>
              </div>

              <Link
                to={`/lessons/${les.id}`}
                className="text-xs text-slate-500 hover:text-accent font-medium"
              >
                Preview
              </Link>
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

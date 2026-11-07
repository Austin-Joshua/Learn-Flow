import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Course } from '../types';
import {
  BookOpen,
  PlusCircle,
  Users,
  Award,
  BarChart3,
  ClipboardList,
  Edit,
  ArrowRight,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';

export const InstructorDashboardPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Course Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const fetchManaged = async () => {
    setIsLoading(true);
    try {
      const res = await api.courses.listManaged();
      setCourses(res.data);

      const queueRes = await api.assignments.getInstructorQueue();
      setQueueCount(queueRes.data.length);
    } catch (err) {
      console.error('Failed to load instructor data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManaged();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.courses.create({
        title,
        description,
        difficulty,
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      await fetchManaged();
    } catch (err) {
      console.error('Failed to create course', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Instructor Studio
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Author curriculum, configure assessment question banks, and evaluate student submissions.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/instructor/grading"
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-2"
          >
            <ClipboardList className="w-4 h-4 text-indigo-600" />
            <span>Grading Queue ({queueCount})</span>
          </Link>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Course</span>
          </button>
        </div>
      </div>

      {/* Courses Table / List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Managed Courses</h2>

        {isLoading ? (
          <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No courses authored yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Create your first course to begin structuring modules and lessons.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              Author New Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      c.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {c.status}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {c.enrolled_count || 0} Learners
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 tracking-tight mb-2">
                    {c.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                    {c.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/instructor/courses/${c.id}/builder`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Curriculum Builder</span>
                  </Link>

                  <Link
                    to={`/instructor/courses/${c.id}/analytics`}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition"
                    title="View Drop-off & Mastery Analytics"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Create Course Track</h3>
            <p className="text-xs text-slate-500 mb-6">
              Initialize a curriculum draft. You can subsequently add sequential modules, lessons, and prerequisites.
            </p>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Advanced Distributed Consensus"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of syllabus and learning outcomes..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

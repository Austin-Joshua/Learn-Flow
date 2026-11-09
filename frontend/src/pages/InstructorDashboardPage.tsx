import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Course } from '../types';
import { AdaptiveGrid } from '../components/common/AdaptiveGrid';
import { AdaptiveModal } from '../components/common/AdaptiveModal';
import { PageHeader, EmptyState, Button, Input, Select, Textarea, Card } from '../components/ui';
import {
  BookOpen,
  PlusCircle,
  BarChart3,
  ClipboardList,
  Edit,
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
      const [res, queueRes] = await Promise.all([
        api.courses.listManaged(),
        api.assignments.getInstructorQueue(),
      ]);
      setCourses(res.data);
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
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Instructor Studio"
        subtitle="Author curriculum, structure sequential lessons, and evaluate student assignments."
        actions={
          <div className="flex items-center space-x-2.5">
            <Link
              to="/instructor/grading"
              className="h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-2"
            >
              <ClipboardList className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Grading Queue ({queueCount})</span>
            </Link>

            <Button
              type="button"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              <span>Create Course</span>
            </Button>
          </div>
        }
      />

      {/* Courses Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Managed Courses</h2>

        {isLoading ? (
          <div className="h-64 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
        ) : courses.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />}
            title="No courses authored yet"
            description="Create your first course track to begin structuring modules and lessons."
            action={
              <Button
                type="button"
                onClick={() => setShowCreateModal(true)}
              >
                Author New Course
              </Button>
            }
          />
        ) : (
          <AdaptiveGrid>
            {courses.map((c) => (
              <Card
                key={c.id}
                className="p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-meta font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-mono ${
                        c.status === 'published'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="text-xs text-slate-400 font-mono font-medium">
                      {c.enrolled_count || 0} Learners
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                    {c.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                    {c.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Link
                    to={`/instructor/courses/${c.id}/builder`}
                    className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center space-x-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Curriculum Builder</span>
                  </Link>

                  <Link
                    to={`/instructor/courses/${c.id}/analytics`}
                    className="p-2 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    title="View Drop-off & Mastery Telemetry"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Link>
                </div>
              </Card>
            ))}
          </AdaptiveGrid>
        )}
      </div>

      {/* Adaptive Modal for Course Creation */}
      <AdaptiveModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Course Track"
        description="Initialize a curriculum track. You can subsequently add sequential modules, lessons, and prerequisite gates."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <Input
            label="Course Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Distributed Consensus Algorithms"
          />

          <Textarea
            label="Description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline the learning objectives and core competencies covered..."
          />

          <Select
            label="Difficulty Tier"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isCreating}
              className="w-full sm:w-auto"
            >
              Create Course Track
            </Button>
          </div>
        </form>
      </AdaptiveModal>
    </div>
  );
};

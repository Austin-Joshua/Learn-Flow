import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Course, Module, Lesson, CourseConcept } from '../types';
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Sparkles,
  Link2,
  CheckCircle,
  AlertTriangle,
  FolderPlus,
  FilePlus,
  Eye,
  Check
} from 'lucide-react';

export const CourseBuilderPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Module modal
  const [showModuleModal, setShowModuleModal] = useState<boolean>(false);
  const [moduleTitle, setModuleTitle] = useState<string>('');

  // Lesson modal
  const [showLessonModal, setShowLessonModal] = useState<boolean>(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [lessonBody, setLessonBody] = useState<string>('');
  const [lessonDuration, setLessonDuration] = useState<number>(10);
  const [selectedConceptId, setSelectedConceptId] = useState<string>('');

  // Concept modal
  const [showConceptModal, setShowConceptModal] = useState<boolean>(false);
  const [conceptName, setConceptName] = useState<string>('');
  const [conceptDesc, setConceptDesc] = useState<string>('');

  // Prerequisite modal
  const [showPrereqModal, setShowPrereqModal] = useState<boolean>(false);
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<string[]>([]);
  const [prereqError, setPrereqError] = useState<string | null>(null);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadCourse = async () => {
    if (!courseId) return;
    setIsLoading(true);
    try {
      const res = await api.courses.getDetail(courseId);
      setCourse(res.data);
      setSelectedPrereqIds(res.data.prerequisite_course_ids || []);

      const listRes = await api.courses.list();
      setAllCourses(listRes.data.filter((c) => c.id !== courseId));
    } catch (err) {
      console.error('Failed to load course builder', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    try {
      const order = (course?.modules?.length || 0) + 1;
      await api.courses.addModule(courseId, { title: moduleTitle, order_index: order });
      setShowModuleModal(false);
      setModuleTitle('');
      await loadCourse();
    } catch (err) {
      console.error('Failed to add module', err);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleId) return;
    try {
      const currentMod = course?.modules?.find((m) => m.id === selectedModuleId);
      const order = (currentMod?.lessons?.length || 0) + 1;
      await api.curriculum.createLesson(selectedModuleId, {
        title: lessonTitle,
        content_type: 'text',
        content_body: lessonBody,
        duration_minutes: lessonDuration,
        order_index: order,
        concept_id: selectedConceptId || undefined,
      });
      setShowLessonModal(false);
      setLessonTitle('');
      setLessonBody('');
      setSelectedConceptId('');
      await loadCourse();
    } catch (err) {
      console.error('Failed to add lesson', err);
    }
  };

  const handleAddConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    try {
      const order = (course?.concepts?.length || 0) + 1;
      await api.courses.addConcept(courseId, {
        name: conceptName,
        description: conceptDesc,
        order_index: order,
      });
      setShowConceptModal(false);
      setConceptName('');
      setConceptDesc('');
      await loadCourse();
    } catch (err) {
      console.error('Failed to add concept', err);
    }
  };

  const handleSavePrerequisites = async () => {
    if (!courseId) return;
    setPrereqError(null);
    try {
      await api.courses.setPrerequisites(courseId, selectedPrereqIds);
      setShowPrereqModal(false);
      setStatusMessage('Prerequisites updated successfully.');
      setTimeout(() => setStatusMessage(null), 3000);
      await loadCourse();
    } catch (err: any) {
      setPrereqError(err.response?.data?.detail || 'Circular dependency cycle detected.');
    }
  };

  const handlePublishToggle = async () => {
    if (!course || !courseId) return;
    const newStatus = course.status === 'published' ? 'draft' : 'published';
    try {
      await api.courses.update(courseId, { status: newStatus });
      setCourse({ ...course, status: newStatus });
    } catch (err) {
      console.error('Failed to toggle publish', err);
    }
  };

  if (isLoading || !course) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link
        to="/instructor/courses"
        className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center space-x-1 mb-6 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Instructor Studio</span>
      </Link>

      {/* Course Meta Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
              course.status === 'published'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {course.status}
            </span>
            <span className="text-xs text-slate-400 capitalize">{course.difficulty}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{course.title}</h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPrereqModal(true)}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
          >
            <Link2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Prerequisites ({course.prerequisite_course_ids?.length || 0})</span>
          </button>

          <button
            onClick={handlePublishToggle}
            className={`px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition ${
              course.status === 'published'
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {course.status === 'published' ? 'Unpublish to Draft' : 'Publish Course'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Concept Taxonomy Bar */}
      <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Adaptive Diagnostic Concepts ({course.concepts?.length || 0})</span>
          </div>
          <p className="text-xs text-indigo-900/80 max-w-xl leading-relaxed">
            Concepts enable the Adaptive Learning Path engine to map failed assessment questions to targeted lessons.
          </p>
        </div>

        <button
          onClick={() => setShowConceptModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Concept</span>
        </button>
      </div>

      {/* Modules & Lessons Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Curriculum Hierarchy</h2>
          <button
            onClick={() => setShowModuleModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Add Module</span>
          </button>
        </div>

        {course.modules && course.modules.length > 0 ? (
          course.modules.map((mod) => (
            <div key={mod.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 p-4 px-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Module {mod.order_index}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{mod.title}</h3>
                </div>

                <button
                  onClick={() => {
                    setSelectedModuleId(mod.id);
                    setShowLessonModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  <span>Add Lesson</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {mod.lessons && mod.lessons.length > 0 ? (
                  mod.lessons.map((les) => (
                    <div key={les.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/60 transition">
                      <div className="flex items-center space-x-3">
                        <BookOpen className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <div>
                          <h4 className="text-xs font-semibold text-slate-800">{les.title}</h4>
                          <span className="text-[11px] text-slate-400">{les.duration_minutes} mins</span>
                        </div>
                      </div>

                      <Link
                        to={`/lessons/${les.id}`}
                        className="text-xs text-slate-500 hover:text-indigo-600 font-medium"
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
          ))
        ) : (
          <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-sm text-slate-500">No modules created yet. Click "Add Module" to start.</p>
          </div>
        )}
      </div>

      {/* Add Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Sequential Module</h3>
            <form onSubmit={handleAddModule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Module Title
                </label>
                <input
                  type="text"
                  required
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="e.g. Module 1: System Models & Network Topologies"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModuleModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  Save Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Module Lesson</h3>
            <p className="text-xs text-slate-500 mb-4">
              Lessons can be associated with a diagnostic concept to enable the Adaptive Recommendation engine.
            </p>

            <form onSubmit={handleAddLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lesson Title
                </label>
                <input
                  type="text"
                  required
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="e.g. Paxos Consensus Algorithm"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Concept Tag (For Adaptive Learning)
                </label>
                <select
                  value={selectedConceptId}
                  onChange={(e) => setSelectedConceptId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">No Concept (General Topic)</option>
                  {course.concepts?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(parseInt(e.target.value) || 10)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lesson Body
                </label>
                <textarea
                  rows={4}
                  value={lessonBody}
                  onChange={(e) => setLessonBody(e.target.value)}
                  placeholder="Write lesson text or guide..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLessonModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  Save Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Concept Modal */}
      {showConceptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Course Diagnostic Concept</h3>
            <form onSubmit={handleAddConcept} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Concept Name
                </label>
                <input
                  type="text"
                  required
                  value={conceptName}
                  onChange={(e) => setConceptName(e.target.value)}
                  placeholder="e.g. Distributed Consensus"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={conceptDesc}
                  onChange={(e) => setConceptDesc(e.target.value)}
                  placeholder="Brief description of the concept..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConceptModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  Save Concept
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Prerequisites Modal with Cycle Detection */}
      {showPrereqModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Course Prerequisites</h3>
            <p className="text-xs text-slate-500 mb-4">
              Select upstream courses that must be completed before a learner can enroll. Validated with cycle detection algorithms.
            </p>

            {prereqError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{prereqError}</span>
              </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
              {allCourses.map((c) => {
                const isSelected = selectedPrereqIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedPrereqIds(selectedPrereqIds.filter((id) => id !== c.id));
                      } else {
                        setSelectedPrereqIds([...selectedPrereqIds, c.id]);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{c.title}</span>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPrereqModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePrerequisites}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow"
              >
                Save Prerequisites
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


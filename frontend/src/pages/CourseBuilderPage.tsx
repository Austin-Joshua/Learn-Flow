import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Course } from '../types';
import { CourseModuleCard } from '../components/curriculum/CourseModuleCard';
import { AddModuleModal } from '../components/curriculum/AddModuleModal';
import { AddLessonModal } from '../components/curriculum/AddLessonModal';
import { AddConceptModal } from '../components/curriculum/AddConceptModal';
import { PrerequisitesModal } from '../components/curriculum/PrerequisitesModal';
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Link2,
  FolderPlus,
  Check,
} from 'lucide-react';

export const CourseBuilderPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Module modal state
  const [showModuleModal, setShowModuleModal] = useState<boolean>(false);
  const [moduleTitle, setModuleTitle] = useState<string>('');

  // Lesson modal state
  const [showLessonModal, setShowLessonModal] = useState<boolean>(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [lessonBody, setLessonBody] = useState<string>('');
  const [lessonDuration, setLessonDuration] = useState<number>(10);
  const [selectedConceptId, setSelectedConceptId] = useState<string>('');

  // Concept modal state
  const [showConceptModal, setShowConceptModal] = useState<boolean>(false);
  const [conceptName, setConceptName] = useState<string>('');
  const [conceptDesc, setConceptDesc] = useState<string>('');

  // Prerequisite modal state
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
    } catch (err: unknown) {
      setPrereqError(axios.isAxiosError(err) && err.response?.data?.detail ? String(err.response.data.detail) : 'Circular dependency cycle detected.');
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
        className="text-xs font-semibold text-slate-500 hover:text-accent flex items-center space-x-1 mb-6 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Instructor Studio</span>
      </Link>

      {/* Course Meta Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className={`text-meta font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
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
            <Link2 className="w-3.5 h-3.5 text-accent" />
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
      <div className="bg-accent-subtle/60 border border-sky-100 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-accent-hover text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Adaptive Diagnostic Concepts ({course.concepts?.length || 0})</span>
          </div>
          <p className="text-xs text-slate-700 max-w-xl leading-relaxed">
            Concepts enable the Adaptive Learning Path engine to map failed assessment questions to targeted lessons.
          </p>
        </div>

        <button
          onClick={() => setShowConceptModal(true)}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1 whitespace-nowrap"
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
            <CourseModuleCard
              key={mod.id}
              module={mod}
              onAddLesson={(moduleId) => {
                setSelectedModuleId(moduleId);
                setShowLessonModal(true);
              }}
            />
          ))
        ) : (
          <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-sm text-slate-500">No modules created yet. Click "Add Module" to start.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddModuleModal
        isOpen={showModuleModal}
        onClose={() => setShowModuleModal(false)}
        onSubmit={handleAddModule}
        moduleTitle={moduleTitle}
        setModuleTitle={setModuleTitle}
      />

      <AddLessonModal
        isOpen={showLessonModal}
        onClose={() => setShowLessonModal(false)}
        onSubmit={handleAddLesson}
        lessonTitle={lessonTitle}
        setLessonTitle={setLessonTitle}
        lessonDuration={lessonDuration}
        setLessonDuration={setLessonDuration}
        lessonBody={lessonBody}
        setLessonBody={setLessonBody}
        selectedConceptId={selectedConceptId}
        setSelectedConceptId={setSelectedConceptId}
        concepts={course.concepts}
      />

      <AddConceptModal
        isOpen={showConceptModal}
        onClose={() => setShowConceptModal(false)}
        onSubmit={handleAddConcept}
        conceptName={conceptName}
        setConceptName={setConceptName}
        conceptDesc={conceptDesc}
        setConceptDesc={setConceptDesc}
      />

      <PrerequisitesModal
        isOpen={showPrereqModal}
        onClose={() => setShowPrereqModal(false)}
        onSave={handleSavePrerequisites}
        allCourses={allCourses}
        selectedPrereqIds={selectedPrereqIds}
        setSelectedPrereqIds={setSelectedPrereqIds}
        prereqError={prereqError}
      />
    </div>
  );
};

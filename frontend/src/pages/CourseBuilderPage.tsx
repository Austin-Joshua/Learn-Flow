import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Course, Module, Lesson, Assessment, Question, Assignment } from '../types';
import { CourseModuleCard } from '../components/curriculum/CourseModuleCard';
import { AddModuleModal } from '../components/curriculum/AddModuleModal';
import { AddLessonModal } from '../components/curriculum/AddLessonModal';
import { AddConceptModal } from '../components/curriculum/AddConceptModal';
import { PrerequisitesModal } from '../components/curriculum/PrerequisitesModal';
import { EditModuleModal } from '../components/curriculum/EditModuleModal';
import { EditLessonModal } from '../components/curriculum/EditLessonModal';
import { LessonResourcesModal } from '../components/curriculum/LessonResourcesModal';
import { CompletionCriteriaModal } from '../components/curriculum/CompletionCriteriaModal';
import { AssessmentAuthoringModal } from '../components/curriculum/AssessmentAuthoringModal';
import { QuestionAuthoringModal } from '../components/curriculum/QuestionAuthoringModal';
import { AssignmentAuthoringModal } from '../components/curriculum/AssignmentAuthoringModal';
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Link2,
  FolderPlus,
  Check,
  Award,
  FileText,
  Trash2,
  Edit2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

export const CourseBuilderPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Module modal state
  const [showModuleModal, setShowModuleModal] = useState<boolean>(false);
  const [moduleTitle, setModuleTitle] = useState<string>('');
  const [showEditModuleModal, setShowEditModuleModal] = useState<boolean>(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  // Lesson modal state
  const [showLessonModal, setShowLessonModal] = useState<boolean>(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [lessonBody, setLessonBody] = useState<string>('');
  const [lessonDuration, setLessonDuration] = useState<number>(10);
  const [selectedConceptId, setSelectedConceptId] = useState<string>('');
  const [showEditLessonModal, setShowEditLessonModal] = useState<boolean>(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showResourceModal, setShowResourceModal] = useState<boolean>(false);
  const [resourceLesson, setResourceLesson] = useState<Lesson | null>(null);

  // Concept modal state
  const [showConceptModal, setShowConceptModal] = useState<boolean>(false);
  const [conceptName, setConceptName] = useState<string>('');
  const [conceptDesc, setConceptDesc] = useState<string>('');

  // Prerequisite modal state
  const [showPrereqModal, setShowPrereqModal] = useState<boolean>(false);
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<string[]>([]);
  const [prereqError, setPrereqError] = useState<string | null>(null);

  // Completion criteria state
  const [showCriteriaModal, setShowCriteriaModal] = useState<boolean>(false);

  // Assessment & Question Authoring Modals
  const [showAssessmentModal, setShowAssessmentModal] = useState<boolean>(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [targetAssessmentId, setTargetAssessmentId] = useState<string | null>(null);
  const [expandedAssessments, setExpandedAssessments] = useState<Record<string, boolean>>({});

  // Assignment Authoring Modal
  const [showAssignmentModal, setShowAssignmentModal] = useState<boolean>(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Status & Guard warnings
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [guardWarningMessage, setGuardWarningMessage] = useState<string | null>(null);

  const loadCourse = async () => {
    if (!courseId) return;
    setIsLoading(true);
    try {
      const res = await api.courses.getDetail(courseId);
      setCourse(res.data);
      setSelectedPrereqIds(res.data.prerequisite_course_ids || []);

      const listRes = await api.courses.list();
      setAllCourses(listRes.data.filter((c) => c.id !== courseId));

      // Load assessments with full question details
      try {
        const assessListRes = await api.courses.getAssessments(courseId);
        const detailedAssessments = await Promise.all(
          assessListRes.data.map(async (a) => {
            try {
              const detailRes = await api.assessments.getDetail(a.id);
              return detailRes.data;
            } catch {
              return {
                id: a.id,
                course_id: a.course_id,
                title: a.title,
                time_limit_minutes: a.time_limit_minutes,
                passing_score_percentage: a.passing_score_percentage,
                max_attempts: a.max_attempts,
                questions: [],
              } as Assessment;
            }
          })
        );
        setAssessments(detailedAssessments);
      } catch {
        // none yet
      }

      // Load practical assignments
      try {
        const assignRes = await api.assignments.listForCourse(courseId);
        setAssignments(assignRes.data);
      } catch {
        // none yet
      }
    } catch (err) {
      console.error('Failed to load course builder', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  // Module Handlers
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

  const handleEditModule = async (title: string) => {
    if (!editingModule) return;
    await api.curriculum.updateModule(editingModule.id, { title });
    setStatusMessage(`Updated module '${title}'.`);
    setTimeout(() => setStatusMessage(null), 3000);
    await loadCourse();
  };

  const handleDeleteModule = async (mod: Module) => {
    if (!window.confirm(`Are you sure you want to delete module '${mod.title}'?`)) return;
    setGuardWarningMessage(null);
    try {
      await api.curriculum.deleteModule(mod.id);
      setStatusMessage(`Deleted module '${mod.title}'.`);
      setTimeout(() => setStatusMessage(null), 3000);
      await loadCourse();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setGuardWarningMessage(
          `Cannot delete module '${mod.title}': Learner progress or attempts already exist. Content is preserved for academic audit records. Archive the course instead.`
        );
      } else {
        alert('Failed to delete module.');
      }
    }
  };

  // Lesson Handlers
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

  const handleEditLesson = async (data: { title: string; content_body?: string; duration_minutes: number; concept_id?: string }) => {
    if (!editingLesson) return;
    await api.curriculum.updateLesson(editingLesson.id, data);
    setStatusMessage(`Updated lesson '${data.title}'.`);
    setTimeout(() => setStatusMessage(null), 3000);
    await loadCourse();
  };

  const handleDeleteLesson = async (les: Lesson) => {
    if (!window.confirm(`Are you sure you want to delete lesson '${les.title}'?`)) return;
    setGuardWarningMessage(null);
    try {
      await api.curriculum.deleteLesson(les.id);
      setStatusMessage(`Deleted lesson '${les.title}'.`);
      setTimeout(() => setStatusMessage(null), 3000);
      await loadCourse();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setGuardWarningMessage(
          `Cannot delete lesson '${les.title}': Existing learner completion progress is recorded. Content is preserved for audit safety. Archive instead.`
        );
      } else {
        alert('Failed to delete lesson.');
      }
    }
  };

  // Assessment Handlers
  const handleSaveAssessment = async (data: { title: string; time_limit_minutes: number; passing_score_percentage: number; max_attempts: number }) => {
    if (!courseId) return;
    if (editingAssessment) {
      await api.assessments.update(editingAssessment.id, data);
      setStatusMessage(`Updated assessment '${data.title}'.`);
    } else {
      await api.assessments.create(courseId, data);
      setStatusMessage(`Created assessment '${data.title}'.`);
    }
    setTimeout(() => setStatusMessage(null), 3000);
    await loadCourse();
  };

  const handleDeleteAssessment = async (a: Assessment) => {
    if (!window.confirm(`Are you sure you want to delete assessment '${a.title}'?`)) return;
    setGuardWarningMessage(null);
    try {
      await api.assessments.delete(a.id);
      setStatusMessage(`Deleted assessment '${a.title}'.`);
      setTimeout(() => setStatusMessage(null), 3000);
      await loadCourse();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setGuardWarningMessage(
          `Cannot delete assessment '${a.title}': Learner attempts have already been submitted. Content is preserved for academic integrity. Archive instead.`
        );
      } else {
        alert('Failed to delete assessment.');
      }
    }
  };

  // Question Handlers
  const handleSaveQuestion = async (data: {
    prompt: string;
    question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer';
    points: number;
    concept_id?: string;
    options: { option_text: string; is_correct: boolean; order_index: number }[];
    accepted_answers: string[];
  }) => {
    if (editingQuestion) {
      await api.assessments.updateQuestion(editingQuestion.id, data);
      setStatusMessage('Updated question.');
    } else if (targetAssessmentId) {
      await api.assessments.addQuestion(targetAssessmentId, data);
      setStatusMessage('Added question to assessment.');
    }
    setTimeout(() => setStatusMessage(null), 3000);
    await loadCourse();
  };

  const handleDeleteQuestion = async (q: Question) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    setGuardWarningMessage(null);
    try {
      await api.assessments.deleteQuestion(q.id);
      setStatusMessage('Deleted question.');
      setTimeout(() => setStatusMessage(null), 3000);
      await loadCourse();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setGuardWarningMessage(
          'Cannot delete question: Learner answers are recorded on attempts for this question. Content is preserved for grading integrity. Archive instead.'
        );
      } else {
        alert('Failed to delete question.');
      }
    }
  };

  // Assignment Handlers
  const handleSaveAssignment = async (data: {
    title: string;
    description: string;
    due_date?: string;
    max_points: number;
    allowed_extensions: string;
  }) => {
    if (!courseId) return;
    if (editingAssignment) {
      await api.assignments.update(editingAssignment.id, data);
      setStatusMessage(`Updated assignment '${data.title}'.`);
    } else {
      await api.assignments.create(courseId, data);
      setStatusMessage(`Created assignment '${data.title}'.`);
    }
    setTimeout(() => setStatusMessage(null), 3000);
    await loadCourse();
  };

  const handleDeleteAssignment = async (asgn: Assignment) => {
    if (!window.confirm(`Are you sure you want to delete assignment '${asgn.title}'?`)) return;
    setGuardWarningMessage(null);
    try {
      await api.assignments.delete(asgn.id);
      setStatusMessage(`Deleted assignment '${asgn.title}'.`);
      setTimeout(() => setStatusMessage(null), 3000);
      await loadCourse();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setGuardWarningMessage(
          `Cannot delete assignment '${asgn.title}': Existing learner submissions are recorded. Content is preserved for audit safety. Archive instead.`
        );
      } else {
        alert('Failed to delete assignment.');
      }
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

  const toggleAssessmentExpand = (id: string) => {
    setExpandedAssessments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (isLoading || !course) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 pb-24">
      <Link
        to="/instructor/courses"
        className="text-xs font-semibold text-slate-500 hover:text-sky-600 dark:text-slate-400 flex items-center space-x-1 mb-6 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Instructor Studio</span>
      </Link>

      {/* Guard Warning Banner */}
      {guardWarningMessage && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 p-4 rounded-2xl text-xs font-semibold flex items-start space-x-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Guarded Content Deletion Blocked:</span>
            <p className="mt-0.5 text-slate-700 dark:text-slate-300 font-normal leading-relaxed">{guardWarningMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setGuardWarningMessage(null)}
            className="text-amber-500 hover:text-amber-700 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success Notification */}
      {statusMessage && (
        <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 p-4 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Course Meta Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{course.title}</h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCriteriaModal(true)}
            className="px-4 py-2 border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-xl text-xs font-semibold shadow-xs transition flex items-center space-x-1.5"
          >
            <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Completion Criteria</span>
          </button>

          <button
            onClick={() => setShowPrereqModal(true)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-xs transition flex items-center space-x-1.5"
          >
            <Link2 className="w-3.5 h-3.5 text-sky-600" />
            <span>Prerequisites ({course.prerequisite_course_ids?.length || 0})</span>
          </button>

          <button
            onClick={handlePublishToggle}
            className={`px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition ${
              course.status === 'published'
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {course.status === 'published' ? 'Unpublish to Draft' : 'Publish Course'}
          </button>
        </div>
      </div>

      {/* Concept Taxonomy Bar */}
      <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Adaptive Diagnostic Concepts ({course.concepts?.length || 0})</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 max-w-xl leading-relaxed">
            Concepts enable the Adaptive Learning Path engine to map failed assessment questions to targeted lessons.
          </p>
        </div>

        <button
          onClick={() => setShowConceptModal(true)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1 whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Concept</span>
        </button>
      </div>

      {/* SECTION 1: Curriculum Hierarchy (Modules & Lessons) */}
      <div className="space-y-6 mb-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Curriculum Hierarchy</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sequential learning modules and reading units.</p>
          </div>
          <button
            onClick={() => setShowModuleModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
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
              onEditModule={(m) => {
                setEditingModule(m);
                setShowEditModuleModal(true);
              }}
              onDeleteModule={handleDeleteModule}
              onEditLesson={(l) => {
                setEditingLesson(l);
                setShowEditLessonModal(true);
              }}
              onDeleteLesson={handleDeleteLesson}
              onManageResources={(l) => {
                setResourceLesson(l);
                setShowResourceModal(true);
              }}
            />
          ))
        ) : (
          <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <p className="text-sm text-slate-500">No modules created yet. Click "Add Module" to start.</p>
          </div>
        )}
      </div>

      {/* SECTION 2: Timed Assessments & Questions Authoring */}
      <div className="space-y-6 mb-12 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assessments & Examinations</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Timed proctored evaluations with configurable passing thresholds and attempt limits.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingAssessment(null);
              setShowAssessmentModal(true);
            }}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Assessment</span>
          </button>
        </div>

        {assessments.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <Award className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No assessments created for this course yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((a) => {
              const isExpanded = Boolean(expandedAssessments[a.id]);
              return (
                <div key={a.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-950/60">
                    <button
                      type="button"
                      onClick={() => toggleAssessmentExpand(a.id)}
                      className="flex items-center space-x-3 text-left min-w-0 cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{a.title}</h3>
                        <div className="flex items-center space-x-3 text-meta font-mono text-slate-500 mt-0.5">
                          <span>{a.time_limit_minutes} mins</span>
                          <span>•</span>
                          <span>Pass: {a.passing_score_percentage}%</span>
                          <span>•</span>
                          <span>Max Attempts: {a.max_attempts}</span>
                          <span>•</span>
                          <span>{a.questions?.length || 0} Questions</span>
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetAssessmentId(a.id);
                          setEditingQuestion(null);
                          setShowQuestionModal(true);
                        }}
                        className="px-3 py-1.5 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Question</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingAssessment(a);
                          setShowAssessmentModal(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Edit Assessment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAssessment(a)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                        title="Delete Assessment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Questions List */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
                      {a.questions && a.questions.length > 0 ? (
                        a.questions.map((q, qIdx) => (
                          <div key={q.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="text-meta font-mono font-bold text-sky-600 dark:text-sky-400">
                                  Q{qIdx + 1}
                                </span>
                                <span className="text-meta font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                                  {q.question_type.replace('_', ' ')}
                                </span>
                                <span className="text-meta font-mono text-slate-400">{q.points} pt</span>
                              </div>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                                {q.prompt}
                              </p>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetAssessmentId(a.id);
                                  setEditingQuestion(q);
                                  setShowQuestionModal(true);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
                                title="Edit Question"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(q)}
                                className="p-1 text-rose-400 hover:text-rose-600 transition cursor-pointer"
                                title="Delete Question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No questions added yet. Click "Add Question" above.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: Practical Course Assignments Authoring */}
      <div className="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Practical Assignments</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hands-on deliverable projects with quarantine virus scanning and instructor grading.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingAssignment(null);
              setShowAssignmentModal(true);
            }}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Assignment</span>
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No practical assignments created yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((asgn) => (
              <div key={asgn.id} className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{asgn.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{asgn.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-meta font-mono text-slate-500 mt-2">
                    <span>Due: {asgn.due_date ? new Date(asgn.due_date).toLocaleDateString() : 'No deadline'}</span>
                    <span>•</span>
                    <span>Max: {asgn.max_points || asgn.max_score || 100} pts</span>
                    <span>•</span>
                    <span>Formats: {asgn.allowed_extensions || 'pdf,zip,docx'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAssignment(asgn);
                      setShowAssignmentModal(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    title="Edit Assignment"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAssignment(asgn)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                    title="Delete Assignment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
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

      <EditModuleModal
        isOpen={showEditModuleModal}
        onClose={() => setShowEditModuleModal(false)}
        onSubmit={handleEditModule}
        module={editingModule}
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

      <EditLessonModal
        isOpen={showEditLessonModal}
        onClose={() => setShowEditLessonModal(false)}
        onSubmit={handleEditLesson}
        lesson={editingLesson}
        concepts={course.concepts}
      />

      <LessonResourcesModal
        isOpen={showResourceModal}
        lesson={resourceLesson}
        onClose={() => {
          setShowResourceModal(false);
          setResourceLesson(null);
        }}
      />

      <CompletionCriteriaModal
        courseId={courseId!}
        isOpen={showCriteriaModal}
        onClose={() => setShowCriteriaModal(false)}
        assessments={assessments}
        assignments={assignments}
      />

      <AssessmentAuthoringModal
        isOpen={showAssessmentModal}
        onClose={() => setShowAssessmentModal(false)}
        onSubmit={handleSaveAssessment}
        initialData={editingAssessment}
      />

      <QuestionAuthoringModal
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        onSubmit={handleSaveQuestion}
        concepts={course.concepts}
        initialData={editingQuestion}
      />

      <AssignmentAuthoringModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        onSubmit={handleSaveAssignment}
        initialData={editingAssignment}
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

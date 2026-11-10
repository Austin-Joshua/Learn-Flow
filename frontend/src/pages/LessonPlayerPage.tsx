import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Lesson, LearningResource } from '../types';
import { LessonContent, LessonHighlight } from '../components/curriculum/LessonContent';
import {
  SelectionActionToolbar,
  SelectionRangeInfo,
  HighlightColor,
} from '../components/study/SelectionActionToolbar';
import { LessonNotesDrawer, StudyNote } from '../components/study/LessonNotesDrawer';
import { LessonExplainDrawer } from '../components/study/LessonExplainDrawer';
import { useAuthStore } from '../store/authStore';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Lock,
  AlertCircle,
  FileText,
  Download,
  BookMarked,
  Sparkles,
  Video,
  FolderArchive,
  PlayCircle,
} from 'lucide-react';

export const LessonPlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const readerRef = useRef<HTMLDivElement>(null);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLockedError, setIsLockedError] = useState<boolean>(false);

  // Text selection & floating action toolbar state
  const [selectionInfo, setSelectionInfo] = useState<SelectionRangeInfo | null>(null);

  // Study Notes Drawer state
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [isNotesMinimized, setIsNotesMinimized] = useState<boolean>(false);

  // Highlighting state
  const [highlights, setHighlights] = useState<LessonHighlight[]>([]);

  // AI Concept Explainer Drawer state
  const [explainText, setExplainText] = useState<string>('');
  const [isExplainOpen, setIsExplainOpen] = useState<boolean>(false);
  const [isExplainMinimized, setIsExplainMinimized] = useState<boolean>(false);

  // Load persistent study notes and highlights for this lesson and user
  useEffect(() => {
    if (!id) return;
    const userKey = user?.id || 'guest';
    try {
      const savedNotes = localStorage.getItem(`learnflow_notes_${id}_${userKey}`);
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      } else {
        setNotes([]);
      }
    } catch {
      setNotes([]);
    }

    try {
      const savedHighlights = localStorage.getItem(`learnflow_highlights_${id}_${userKey}`);
      if (savedHighlights) {
        setHighlights(JSON.parse(savedHighlights));
      } else {
        setHighlights([]);
      }
    } catch {
      setHighlights([]);
    }
  }, [id, user?.id]);

  const saveNotes = (updated: StudyNote[]) => {
    setNotes(updated);
    if (!id) return;
    const userKey = user?.id || 'guest';
    try {
      localStorage.setItem(`learnflow_notes_${id}_${userKey}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const saveHighlights = (updated: LessonHighlight[]) => {
    setHighlights(updated);
    if (!id) return;
    const userKey = user?.id || 'guest';
    try {
      localStorage.setItem(`learnflow_highlights_${id}_${userKey}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Handle text selection in lesson body
  const handleMouseUp = () => {
    // Delay slightly to ensure browser has registered the completed selection range
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setSelectionInfo(null);
        return;
      }

      const text = sel.toString().trim();
      if (text.length < 2) {
        setSelectionInfo(null);
        return;
      }

      // Ensure selection is inside the lesson text container
      if (readerRef.current && !readerRef.current.contains(sel.anchorNode)) {
        setSelectionInfo(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionInfo({ text, rect });
    }, 10);
  };

  const handleAddNote = (text: string) => {
    if (!id) return;
    const newNote: StudyNote = {
      id: `note-${Date.now()}`,
      lessonId: id,
      text,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    saveNotes([newNote, ...notes]);
    setIsNotesOpen(true);
    setIsNotesMinimized(false);
    setSelectionInfo(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleHighlight = (text: string, color: HighlightColor) => {
    const newHl: LessonHighlight = {
      id: `hl-${Date.now()}`,
      text,
      color,
    };
    saveHighlights([...highlights, newHl]);
    setSelectionInfo(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleRemoveHighlight = (hlId: string) => {
    saveHighlights(highlights.filter((h) => h.id !== hlId));
  };

  const handleExplain = (text: string) => {
    setExplainText(text);
    setIsExplainOpen(true);
    setIsExplainMinimized(false);
    setSelectionInfo(null);
    window.getSelection()?.removeAllRanges();
  };

  const loadLesson = async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);
    setIsLockedError(false);
    try {
      const res = await api.curriculum.getLesson(id);
      setLesson(res.data);
      try {
        const resList = await api.curriculum.listResources(id);
        setResources(resList.data);
      } catch {
        // Resources might not exist or optional
        setResources([]);
      }
    } catch (err: unknown) {
      console.error('Failed to load lesson', err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const detail = err.response?.data?.detail;
        if (status === 403) {
          setIsLockedError(true);
          setErrorMessage(
            typeof detail === 'string'
              ? detail
              : 'This lesson is currently locked by course progression rules.'
          );
        } else {
          setErrorMessage(
            typeof detail === 'string'
              ? detail
              : 'Unable to load lesson contents. Please verify your enrollment.'
          );
        }
      } else {
        setErrorMessage('Failed to load lesson.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLesson();
  }, [id]);

  const handleMarkComplete = async () => {
    if (!id) return;
    setIsCompleting(true);
    setErrorMessage(null);
    try {
      await api.curriculum.markComplete(id);
      setLesson((prev) => (prev ? { ...prev, is_completed: true } : null));
    } catch (err: unknown) {
      console.error('Failed to mark lesson complete', err);
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setErrorMessage(String(err.response.data.detail));
      } else {
        setErrorMessage('Could not record lesson completion.');
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDownloadResource = async (resourceId: string, title: string) => {
    try {
      const res = await api.curriculum.getDownloadUrl(resourceId);
      window.open(res.data.download_url, '_blank');
    } catch (err: unknown) {
      console.error('Failed to get download URL', err);
      setErrorMessage(`Unable to download ${title}.`);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  // Graceful 403 / Locked Screen
  if (isLockedError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Module Locked
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 mb-6 leading-relaxed">
          {errorMessage || 'You must complete the preceding modules and assessments before accessing this lesson.'}
        </p>
        <div className="flex items-center justify-center space-x-3">
          <Link
            to="/my-learning"
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            My Courses
          </Link>
          <Link
            to="/my-journey"
            className="px-4 py-2 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-lg text-xs font-semibold transition-colors"
          >
            View Journey Trail
          </Link>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Lesson Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          {errorMessage || 'The requested lesson could not be retrieved.'}
        </p>
        <Link
          to="/my-learning"
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Return to My Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto font-sans pb-28 sm:pb-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <Link
          to={`/courses/${lesson.course_id}`}
          className="text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 flex items-center space-x-1 transition-colors min-h-[40px] py-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Syllabus</span>
        </Link>

        <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
          <Clock className="w-3.5 h-3.5" />
          <span>{lesson.duration_minutes} min read</span>
        </div>
      </div>

      {errorMessage && !isLockedError && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Lesson Reader Card (Calm Earthy Deep Green in Dark Mode) */}
      <div className="bg-white dark:bg-[#050e09] rounded-2xl border border-slate-200/90 dark:border-emerald-500/15 shadow-sm p-5 sm:p-8 mb-6 transition-colors">
        <div className="border-b border-slate-100 dark:border-emerald-500/12 pb-4 mb-5 sm:mb-6">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
            <BookOpen className="w-4 h-4" />
            <span>Lesson Content</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {lesson.title}
          </h1>
        </div>

        {/* Technical Video Lecture Deck (if video resource or video content type) */}
        {(() => {
          const videoRes = resources.find(
            (r) =>
              r.file_type?.includes('video') ||
              r.title.toLowerCase().includes('lecture recording') ||
              r.title.toLowerCase().includes('video') ||
              r.file_url.endsWith('.mp4')
          );
          if (!videoRes && lesson.content_type !== 'video') return null;

          const videoSrc = videoRes?.file_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
          return (
            <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-emerald-500/20 bg-slate-950 shadow-md">
              <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center space-x-2 truncate mr-3">
                  <Video className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-bold text-white truncate">
                    {videoRes ? videoRes.title : `Technical Video Lecture: ${lesson.title}`}
                  </span>
                </div>
                {videoRes && (
                  <button
                    type="button"
                    onClick={() => handleDownloadResource(videoRes.id, videoRes.title)}
                    className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1 transition cursor-pointer shrink-0"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download (.mp4)</span>
                  </button>
                )}
              </div>
              <video
                controls
                playsInline
                className="w-full aspect-video bg-black"
                src={videoSrc}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          );
        })()}

        {/* Content Body with 65-75 ch optimal line length */}
        <div
          ref={readerRef}
          onMouseUp={handleMouseUp}
          className="max-w-[70ch] mx-auto text-slate-700 dark:text-slate-300 leading-relaxed text-base sm:text-lg select-text"
        >
          {lesson.content_body ? (
            <LessonContent
              markdown={lesson.content_body}
              highlights={highlights}
              onRemoveHighlight={handleRemoveHighlight}
            />
          ) : (
            <p className="text-slate-500 italic">No content text available for this lesson.</p>
          )}
        </div>

        {/* Downloadable Resources Section */}
        {resources.length > 0 && (
          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-4 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Lesson Attachments & Downloadable Resources ({resources.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resources.map((r) => {
                const isVideo = r.file_type?.includes('video') || r.title.toLowerCase().includes('video') || r.file_url.endsWith('.mp4');
                const isZip = r.file_type?.includes('zip') || r.title.toLowerCase().includes('lab') || r.file_url.endsWith('.zip');
                const isPdf = r.file_type?.includes('pdf') || r.file_url.includes('pdf');

                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#040b07] border border-slate-200 dark:border-emerald-500/15 rounded-2xl"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      {isVideo ? (
                        <Video className="w-5 h-5 text-indigo-500 shrink-0" />
                      ) : isZip ? (
                        <FolderArchive className="w-5 h-5 text-amber-500 shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                      )}
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{r.title}</p>
                        <p className="text-meta text-slate-400 font-mono">
                          {r.file_size_bytes ? `${Math.round(r.file_size_bytes / 1024)} KB` : 'Document'} · {isVideo ? 'MP4 Video' : isZip ? 'ZIP Archive' : isPdf ? 'PDF Reference' : 'Resource'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadResource(r.id, r.title)}
                      className="ml-3 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-lg text-xs font-semibold flex items-center space-x-1 transition shrink-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Completion Bar (Desktop / Tablet) */}
        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 hidden sm:flex items-center justify-between gap-4">
          <div>
            {lesson.is_completed ? (
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Lesson Completed</span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Marking complete records progress and unlocks the next sequential material.
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {!lesson.is_completed && (
              <button
                onClick={handleMarkComplete}
                disabled={isCompleting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer min-h-[44px]"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isCompleting ? 'Saving...' : 'Mark as Complete'}</span>
              </button>
            )}

            <Link
              to={`/courses/${lesson.course_id}`}
              className="px-5 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center space-x-1.5 min-h-[44px]"
            >
              <span>Course Syllabus</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-30 pb-safe shadow-lg flex items-center space-x-2">
        {!lesson.is_completed ? (
          <button
            onClick={handleMarkComplete}
            disabled={isCompleting}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm min-h-[48px] disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isCompleting ? 'Saving...' : 'Mark as Complete'}</span>
          </button>
        ) : (
          <div className="flex-1 py-3 px-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 min-h-[48px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Completed</span>
          </div>
        )}

        <Link
          to={`/courses/${lesson.course_id}`}
          className="py-3 px-4 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 min-h-[48px]"
        >
          <span>Syllabus</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Floating Action Toolbar on Text Selection */}
      <SelectionActionToolbar
        selectionInfo={selectionInfo}
        onAddNote={handleAddNote}
        onHighlight={handleHighlight}
        onExplain={handleExplain}
        onClearSelection={() => {
          setSelectionInfo(null);
          window.getSelection()?.removeAllRanges();
        }}
      />

      {/* Study Notes Drawer (Slides in from Right) */}
      <LessonNotesDrawer
        isOpen={isNotesOpen}
        isMinimized={isNotesMinimized}
        notes={notes}
        lessonTitle={lesson.title}
        onClose={() => setIsNotesOpen(false)}
        onToggleMinimize={() => setIsNotesMinimized(!isNotesMinimized)}
        onUpdateNote={(noteId, personalNote) => {
          saveNotes(notes.map((n) => (n.id === noteId ? { ...n, personalNote } : n)));
        }}
        onDeleteNote={(noteId) => {
          saveNotes(notes.filter((n) => n.id !== noteId));
        }}
        onExplainSnippet={handleExplain}
      />

      {/* AI Concept Explainer Drawer (Slides in from Right) */}
      <LessonExplainDrawer
        isOpen={isExplainOpen}
        isMinimized={isExplainMinimized}
        selectedText={explainText}
        lessonTitle={lesson.title}
        lessonId={lesson.id}
        courseId={lesson.course_id}
        onClose={() => setIsExplainOpen(false)}
        onToggleMinimize={() => setIsExplainMinimized(!isExplainMinimized)}
        onAddNote={handleAddNote}
      />

      {/* Right Edge Floating Dock Pills (Quick Launchers & Minimized Tabs) */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex flex-col items-end gap-2 pr-0.5 select-none pointer-events-auto">
        {/* Notes Dock Tab */}
        <button
          type="button"
          onClick={() => {
            setIsNotesOpen(true);
            setIsNotesMinimized(false);
          }}
          className={`skeuo-card group flex items-center gap-1.5 pl-2.5 pr-2 py-2 rounded-l-2xl border-y border-l border-slate-300 dark:border-white/15 bg-white/95 dark:bg-[#070b14]/95 shadow-xl hover:-translate-x-1 transition-all cursor-pointer ${
            isNotesOpen && !isNotesMinimized ? 'ring-2 ring-[#0082fb]/50' : ''
          }`}
          title="Open Study Notes Ledger"
        >
          <BookMarked className="w-4 h-4 text-[#0082fb] group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline text-xs font-bold text-slate-800 dark:text-slate-200">
            Notes
          </span>
          {notes.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#0082fb]/15 text-[#0082fb] dark:text-sky-300 font-bold">
              {notes.length}
            </span>
          )}
        </button>

        {/* AI Explainer Dock Tab */}
        <button
          type="button"
          onClick={() => {
            if (explainText) {
              setIsExplainOpen(true);
              setIsExplainMinimized(false);
            } else {
              setIsExplainOpen(true);
              setIsExplainMinimized(false);
              setExplainText(
                'Select or highlight any text or formula in the lesson to generate an AI conceptual breakdown with definitions and practical examples.'
              );
            }
          }}
          className={`skeuo-card group flex items-center gap-1.5 pl-2.5 pr-2 py-2 rounded-l-2xl border-y border-l border-slate-300 dark:border-white/15 bg-white/95 dark:bg-[#070b14]/95 shadow-xl hover:-translate-x-1 transition-all cursor-pointer ${
            isExplainOpen && !isExplainMinimized ? 'ring-2 ring-indigo-500/50' : ''
          }`}
          title="Open AI Concept Explainer"
        >
          <Sparkles className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform animate-pulse" />
          <span className="hidden md:inline text-xs font-bold text-slate-800 dark:text-slate-200">
            Explainer
          </span>
        </button>
      </div>
    </div>
  );
};

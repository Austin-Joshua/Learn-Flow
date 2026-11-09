import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Minus,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Send,
  RotateCcw,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { apiClient } from '../../services/api';
import { CopilotMessageContent, ChatMessageData } from '../ai/CopilotMessageContent';

interface LessonExplainDrawerProps {
  isOpen: boolean;
  isMinimized: boolean;
  selectedText: string;
  lessonTitle: string;
  lessonId: string;
  courseId?: string;
  onClose: () => void;
  onToggleMinimize: () => void;
  onAddNote?: (text: string) => void;
}

export const LessonExplainDrawer: React.FC<LessonExplainDrawerProps> = ({
  isOpen,
  isMinimized,
  selectedText,
  lessonTitle,
  lessonId,
  courseId,
  onClose,
  onToggleMinimize,
  onAddNote,
}) => {
  const [width, setWidth] = useState<number>(440);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string>('');
  const [followUpQuery, setFollowUpQuery] = useState<string>('');
  const [history, setHistory] = useState<ChatMessageData[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(440);
  const contentEndRef = useRef<HTMLDivElement>(null);

  // Auto-trigger explanation when a new selectedText arrives
  useEffect(() => {
    if (!selectedText || !isOpen) return;

    let cancelled = false;
    const fetchExplanation = async () => {
      setIsLoading(true);
      setExplanation('');
      setHistory([]);
      try {
        const res = await apiClient.post('/ai/assistant/explain-concept', {
          selected_text: selectedText,
          lesson_title: lessonTitle,
          lesson_id: lessonId,
          course_id: courseId,
        });

        if (!cancelled && res.data) {
          const answer = res.data.explanation || 'No detailed explanation generated.';
          setExplanation(answer);
          setHistory([
            {
              id: 'init-explain',
              sender: 'assistant',
              text: answer,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      } catch (err) {
        if (!cancelled) {
          const fallback = `### ${selectedText.slice(0, 60)}...\n\n**Theoretical Concept:**\nThis excerpt represents an academic concept in ${lessonTitle}.\n\n**Key Takeaway:**\nReview the surrounding lesson context and prerequisites to solidify your understanding.`;
          setExplanation(fallback);
          setHistory([
            {
              id: 'fallback-explain',
              sender: 'assistant',
              text: fallback,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchExplanation();

    return () => {
      cancelled = true;
    };
  }, [selectedText, isOpen, lessonId, lessonTitle, courseId]);

  // Handle follow up question
  const handleFollowUp = async () => {
    if (!followUpQuery.trim() || isLoading) return;

    const userText = followUpQuery.trim();
    setFollowUpQuery('');

    const userMsg: ChatMessageData = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setHistory((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await apiClient.post('/ai/assistant/ask', {
        query: `Regarding the concept "${selectedText}": ${userText}`,
        page: `/lessons/${lessonId}`,
      });

      const botMsg: ChatMessageData = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: res.data.answer,
        suggested_actions: res.data.suggested_actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setHistory((prev) => [...prev, botMsg]);
    } catch {
      const errMsg: ChatMessageData = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Unable to connect to academic explainer service.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setHistory((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      contentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Resize handler
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const delta = startXRef.current - e.clientX;
      const newWidth = Math.min(Math.max(startWidthRef.current + delta, 360), Math.min(840, window.innerWidth - 60));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleCopyExplanation = async () => {
    if (!explanation) return;
    try {
      await navigator.clipboard.writeText(explanation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (!isOpen || isMinimized) {
    return null;
  }

  return (
    <div
      style={{ width: `${width}px` }}
      className="fixed right-0 top-0 bottom-0 z-40 bg-white dark:bg-[#070b14] border-l border-slate-200/90 dark:border-white/10 shadow-2xl flex flex-col font-sans transition-shadow"
    >
      {/* Resizing Drag Handle on Left Edge */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute left-0 top-0 bottom-0 w-2 hover:w-2.5 -translate-x-1/2 cursor-ew-resize hover:bg-[#0082fb]/40 transition-colors z-50 flex items-center justify-center group"
        title="Drag left or right to resize explainer drawer"
      >
        <div className="w-[3px] h-8 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-[#0082fb] transition-colors" />
      </div>

      {/* Drawer Header Deck */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950 text-white border-b border-slate-800 flex items-center justify-between shadow-xs select-none">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 p-[1.5px] shadow-sm shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-sky-400">
              <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold tracking-tight text-white truncate">AI Concept Explainer</h3>
            <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Gemini Academic Tutor
            </p>
          </div>
        </div>

        {/* Controls: Minimize, Close */}
        <div className="flex items-center space-x-1 text-slate-400">
          <button
            type="button"
            onClick={handleCopyExplanation}
            title="Copy explanation"
            className="skeuo-icon-btn p-1.5 w-7 h-7 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onToggleMinimize}
            title="Minimize to side dock"
            className="skeuo-icon-btn p-1.5 w-7 h-7 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close Explainer"
            className="skeuo-icon-btn p-1.5 w-7 h-7 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Selected Excerpt Bar */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-white/5 space-y-1.5">
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
          Inspected Selection:
        </span>
        <div className="p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-xs font-serif italic text-slate-700 dark:text-slate-300 leading-relaxed max-h-20 overflow-y-auto">
          "{selectedText}"
        </div>
        {onAddNote && (
          <button
            type="button"
            onClick={() => onAddNote(selectedText)}
            className="text-[11px] text-[#0082fb] hover:text-[#0066cc] dark:text-sky-400 font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            <span>+ Save excerpt to Study Notes</span>
          </button>
        )}
      </div>

      {/* Content & History Deck */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:thin]">
        {isLoading && history.length === 0 && (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-500 mx-auto animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Synthesizing Academic Definitions & Examples...
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Consulting Gemini 2.0 with lesson curriculum context.
            </p>
          </div>
        )}

        {history.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`rounded-2xl p-3.5 leading-relaxed max-w-[92%] transition-all ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-[#0082fb] to-[#155dfc] text-white rounded-tr-xs shadow-md border border-[#0066cc]'
                  : 'skeuo-card bg-white dark:bg-[#0c121e] text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-white/10 shadow-xs'
              }`}
            >
              <CopilotMessageContent message={msg} />
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isLoading && history.length > 0 && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 py-1">
            <div className="w-6 h-6 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-400 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-mono text-[11px]">Thinking...</span>
          </div>
        )}

        <div ref={contentEndRef} />
      </div>

      {/* Follow-up Question Input Deck */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2 pb-6 md:pb-3 pb-safe">
        <input
          type="text"
          value={followUpQuery}
          onChange={(e) => setFollowUpQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFollowUp()}
          placeholder="Ask follow-up on this concept..."
          className="skeuo-input flex-1 px-3.5 py-2 text-xs placeholder-slate-400 focus:outline-none transition-colors"
        />
        <button
          type="button"
          onClick={handleFollowUp}
          disabled={!followUpQuery.trim() || isLoading}
          className="skeuo-button-primary h-9 w-9 rounded-lg flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
          title="Send follow-up"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};


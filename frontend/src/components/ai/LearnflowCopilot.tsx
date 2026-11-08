import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import {
  Bot,
  X,
  Minimize2,
  Maximize2,
  Send,
  ShieldCheck,
  Mic,
  MicOff,
  ChevronRight
} from 'lucide-react';

interface ActionItem {
  label: string;
  path: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  provenance?: string;
  suggested_actions?: ActionItem[];
  timestamp: string;
  tokens_used?: { input_tokens: number; output_tokens: number; total_tokens: number };
  latency_ms?: number;
  cached?: boolean;
  sources?: Array<{ title: string; course_title?: string; source_type: string; citation_ref: string }>;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  start: () => void;
  stop: () => void;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}

const DEFAULT_SUGGESTIONS: Record<'learner' | 'instructor' | 'hod' | 'admin', string[]> = {
  learner: [
    'How do I view my current course progress?',
    'What are the requirements to earn my certificate?',
    'How do lesson and course prerequisites work?',
    'Help me review key concepts before an assessment'
  ],
  instructor: [
    'How do I create a new course or add lessons?',
    'Where do I find and grade student assignment submissions?',
    'How can I view student completion rates for my course?'
  ],
  hod: [
    'How do I review department course completion rates?',
    'Where can I inspect faculty grading turnaround times?',
    'How do I view curriculum health across the department?'
  ],
  admin: [
    'How do I manage user accounts and assign roles?',
    'Where can I review system security and audit logs?',
    'How can I verify or manage course certificates?'
  ]
};

export const LearnflowCopilot: React.FC = () => {
  const { hasRole } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userRoleKey: 'learner' | 'instructor' | 'hod' | 'admin' = hasRole('admin')
    ? 'admin'
    : hasRole('hod')
    ? 'hod'
    : hasRole('instructor')
    ? 'instructor'
    : 'learner';

  // Initial welcome message and contextual briefing
  useEffect(() => {
    let cancelled = false;
    const loadBriefing = async () => {
      try {
        const res = await apiClient.get('/ai/assistant/briefing', {
          params: { page: location.pathname }
        });
        if (!cancelled && res.data) {
          setMessages([
            {
              id: 'init-briefing',
              sender: 'assistant',
              text: res.data.answer,
              provenance: res.data.provenance,
              suggested_actions: res.data.suggested_actions,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } catch {
        if (!cancelled) {
          setMessages([
            {
              id: 'fallback-briefing',
              sender: 'assistant',
              text: 'Hello! I am your Learnflow study assistant. Ask me questions about your courses, lessons, assignments, or study progress.',
              provenance: 'CURRICULUM_ASSISTANT',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      }
    };

    loadBriefing();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, userRoleKey]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isTyping) return;

    setInputQuery('');

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await apiClient.post('/ai/assistant/ask', {
        query: textToSend,
        page: location.pathname
      });

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: res.data.answer,
        provenance: res.data.provenance,
        suggested_actions: res.data.suggested_actions,
        tokens_used: res.data.tokens_used,
        latency_ms: res.data.latency_ms,
        cached: res.data.cached,
        sources: res.data.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'The assistant could not reach the course kernel. Please ensure the backend is connected.',
        provenance: 'OFFLINE_STATE',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleVoice = () => {
    const win = window as unknown as WindowWithSpeech;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      setInputQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <>
      {/* Floating Bottom-Right Launcher Pill */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center"
          >
            <button
              onClick={() => setIsOpen(true)}
              aria-label="Open Learnflow AI Study Copilot"
              className="h-12 px-4 rounded-full bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white shadow-xl hover:shadow-2xl flex items-center space-x-2.5 border border-slate-700/60 dark:border-sky-400/40 group transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-sky-500/20 dark:bg-white/20 flex items-center justify-center text-sky-400 dark:text-white group-hover:rotate-12 transition-transform">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold tracking-wide">Study Copilot</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Interactive Copilot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className={`fixed z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 font-sans ${
              isExpanded
                ? 'inset-4 sm:inset-10'
                : 'bottom-6 right-6 w-[92vw] sm:w-[420px] h-[580px] max-h-[88vh]'
            }`}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-md bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h3 className="text-xs font-bold tracking-tight">Learnflow Copilot</h3>
                    <span className="px-1.5 py-0.2 rounded-xs bg-sky-500/20 text-sky-300 text-[10px] font-medium border border-sky-500/30">
                      Study Assistant
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Workspace: {userRoleKey.toUpperCase()} · Verified Course Content
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1 text-slate-400">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Restore size' : 'Expand full-screen'}
                  className="p-1.5 hover:text-white hover:bg-slate-800 rounded-sm transition-colors cursor-pointer"
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close assistant"
                  className="p-1.5 hover:text-rose-400 hover:bg-slate-800 rounded-sm transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Academic Integrity Honor Banner */}
            <div className="bg-sky-50 dark:bg-slate-800/80 px-3.5 py-1.5 border-b border-sky-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-sky-900 dark:text-sky-300 font-medium">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Academic Honor Code: Verified Study Guidance</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Assistant v2.0</span>
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-slate-900 dark:bg-sky-600 text-white rounded-br-xs shadow-sm'
                        : 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 rounded-bl-xs shadow-subtle'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Suggested Navigation Actions */}
                    {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                          Suggested Actions:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggested_actions.map((act, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                navigate(act.path);
                                if (!isExpanded) setIsOpen(false);
                              }}
                              className="px-2.5 py-1 rounded-sm bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 text-[11px] font-medium text-sky-700 dark:text-sky-300 inline-flex items-center space-x-1 transition-colors cursor-pointer"
                            >
                              <span>{act.label}</span>
                              <ChevronRight className="w-3 h-3 text-sky-500" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-mono px-1">
                    {msg.provenance && (
                      <span className="text-sky-600 dark:text-sky-400 font-semibold">[{msg.provenance}]</span>
                    )}
                    {msg.latency_ms !== undefined && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {msg.latency_ms}ms
                      </span>
                    )}
                    {msg.tokens_used && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {msg.tokens_used.total_tokens} tokens
                      </span>
                    )}
                    {msg.cached && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        Cached
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center space-x-2 text-slate-400 text-xs py-1">
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                    <Bot className="w-3 h-3 animate-pulse text-sky-500" />
                  </div>
                  <span className="italic text-[11px]">Analyzing course repository...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 overflow-x-auto whitespace-nowrap space-x-1.5">
              {(DEFAULT_SUGGESTIONS[userRoleKey] || DEFAULT_SUGGESTIONS.learner).map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sug)}
                  disabled={isTyping}
                  className="inline-block px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2">
              <button
                type="button"
                onClick={toggleVoice}
                title={isListening ? 'Stop listening' : 'Speak query'}
                className={`p-2 rounded-md transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? 'Listening to voice...' : 'Ask about concepts, courses, prerequisites...'}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-colors"
              />

              <button
                onClick={() => handleSend()}
                disabled={!inputQuery.trim() || isTyping}
                className="h-8 w-8 rounded-md bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { motionTokens } from '../../utils/motion';
import { useDeviceClass } from '../../hooks/useDeviceClass';
import { UserAvatar } from '../common/UserAvatar';
import {
  Bot,
  X,
  Minimize2,
  Maximize2,
  Send,
  Mic,
  MicOff
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
  const { hasRole, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useDeviceClass();

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

  // Initial welcome message and contextual briefing (lazy loaded on demand or when opened)
  useEffect(() => {
    let cancelled = false;
    // Skip firing background network requests if copilot is closed and already initialized
    if (!isOpen && messages.length > 0) return;

    const loadBriefing = async () => {
      try {
        const res = await apiClient.get('/ai/assistant/briefing', {
          params: { page: location.pathname }
        });
        if (!cancelled && res.data) {
          setMessages((prev) => {
            // Keep conversation history if user has had an active session
            if (prev.length > 1) return prev;
            return [
              {
                id: 'init-briefing',
                sender: 'assistant',
                text: res.data.answer,
                provenance: res.data.provenance,
                suggested_actions: res.data.suggested_actions,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ];
          });
        }
      } catch {
        if (!cancelled) {
          setMessages((prev) => {
            if (prev.length > 0) return prev;
            return [
              {
                id: 'fallback-briefing',
                sender: 'assistant',
                text: 'Hello! I am your Learnflow study assistant. Ask me questions about your courses, lessons, assignments, or study progress.',
                provenance: 'CURRICULUM_ASSISTANT',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ];
          });
        }
      }
    };

    loadBriefing();
    return () => {
      cancelled = true;
    };
  }, [isOpen, location.pathname, userRoleKey]);

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
      {/* Floating Bottom-Right Launcher Actuator (Icon Only) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex items-center select-none"
          >
            <button
              onClick={() => setIsOpen(true)}
              aria-label="Open Study Copilot"
              title="Study Copilot"
              className="skeuo-twin-launcher h-12 w-12 rounded-full text-white flex items-center justify-center group cursor-pointer shadow-lg"
            >
              {/* Core Icon Orb */}
              <div className="relative w-8 h-8 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full border border-sky-400/40 animate-ping opacity-25" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Interactive Study Copilot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={motionTokens.transition.state}
            className={`fixed z-50 bg-white dark:bg-[#070b14] border border-slate-200/90 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 font-sans ${
              isExpanded
                ? 'inset-4 sm:inset-10 rounded-2xl'
                : 'inset-x-0 bottom-0 top-14 rounded-t-2xl md:top-auto md:inset-x-auto md:bottom-6 md:right-6 md:w-[430px] md:h-[600px] md:max-h-[88vh] md:rounded-2xl'
            }`}
          >
            {/* Mobile Drag-to-Close indicator */}
            {isMobile && (
              <div
                className="w-12 h-1 bg-slate-700 hover:bg-slate-500 rounded-full mx-auto my-2 cursor-pointer"
                onClick={() => setIsOpen(false)}
                title="Close copilot sheet"
              />
            )}

            {/* Study Copilot Header Deck */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950 text-white border-b border-slate-800 flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0082fb] to-cyan-400 p-[1.5px] shadow-sm">
                    <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-sky-400">
                      <Bot className="w-4 h-4 text-sky-400" />
                    </div>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-slate-900" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold tracking-tight text-white">Study Copilot</h3>
                  <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Online
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 text-slate-400">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Restore size' : 'Expand full-screen'}
                  className="skeuo-icon-btn p-1.5 w-7 h-7 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close assistant"
                  title="Close assistant"
                  className="skeuo-icon-btn p-1.5 w-7 h-7 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chat Messages Feed with Skeuomorphic Bubbles */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70 dark:bg-[#02050e] text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar: Bot icon on assistant, UserAvatar on user */}
                  {msg.sender === 'assistant' ? (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-cyan-500 p-[1px] shrink-0 mt-0.5 shadow-xs">
                      <div className="w-full h-full bg-slate-900 rounded-[7px] flex items-center justify-center text-sky-400">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ) : (
                    <div className="shrink-0 mt-0.5">
                      <UserAvatar user={user} size="sm" showStatus={false} />
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[82%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 leading-relaxed transition-all ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-[#0082fb] to-[#155dfc] text-white rounded-tr-xs shadow-md border border-[#0066cc] text-shadow-sm'
                          : 'skeuo-card bg-white dark:bg-[#0b101b] text-slate-800 dark:text-slate-100 rounded-tl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    <div className="mt-1 px-1 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center space-x-2.5 text-slate-400 text-xs py-1">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 animate-pulse">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-label text-slate-500 dark:text-slate-400">Thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips with Skeuomorphic Tactile Pills */}
            <div className="p-2.5 bg-slate-100/70 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap space-x-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {(DEFAULT_SUGGESTIONS[userRoleKey] || DEFAULT_SUGGESTIONS.learner).map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sug)}
                  disabled={isTyping}
                  className="skeuo-button-secondary inline-block px-3 py-1 rounded-full text-label font-medium text-slate-700 dark:text-slate-300 text-xs transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Tactile Skeuomorphic Input Console Deck */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2 pb-6 md:pb-3 pb-safe">
              <button
                type="button"
                onClick={toggleVoice}
                title={isListening ? 'Stop listening' : 'Speak query'}
                className={`skeuo-icon-btn p-2 w-9 h-9 rounded-lg transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse border-rose-600'
                    : 'text-slate-500 dark:text-slate-300'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4 text-rose-500" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? 'Listening to voice...' : 'Ask about concepts, courses, prerequisites...'}
                className="skeuo-input flex-1 px-3.5 py-2 text-xs placeholder-slate-400 focus:outline-none transition-colors"
              />

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputQuery.trim() || isTyping}
                className="skeuo-button-primary h-9 w-9 rounded-lg flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer"
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

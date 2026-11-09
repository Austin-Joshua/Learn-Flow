import React, { useState, useEffect, useRef } from 'react';
import {
  BookmarkPlus,
  BookMarked,
  X,
  Minus,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  Check,
  Download,
  Clock,
  Sparkles,
  Search
} from 'lucide-react';

export interface StudyNote {
  id: string;
  lessonId: string;
  text: string;
  personalNote?: string;
  createdAt: string;
}

interface LessonNotesDrawerProps {
  isOpen: boolean;
  isMinimized: boolean;
  notes: StudyNote[];
  lessonTitle: string;
  onClose: () => void;
  onToggleMinimize: () => void;
  onUpdateNote: (id: string, personalNote: string) => void;
  onDeleteNote: (id: string) => void;
  onExplainSnippet?: (text: string) => void;
}

export const LessonNotesDrawer: React.FC<LessonNotesDrawerProps> = ({
  isOpen,
  isMinimized,
  notes,
  lessonTitle,
  onClose,
  onToggleMinimize,
  onUpdateNote,
  onDeleteNote,
  onExplainSnippet,
}) => {
  const [width, setWidth] = useState<number>(400);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(400);

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
      // Moving left increases drawer width
      const delta = startXRef.current - e.clientX;
      const newWidth = Math.min(Math.max(startWidthRef.current + delta, 320), Math.min(760, window.innerWidth - 60));
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

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleExportNotes = () => {
    if (notes.length === 0) return;
    const content = notes
      .map(
        (n, i) =>
          `### Note ${i + 1} (${n.createdAt})\n> "${n.text}"\n\n${
            n.personalNote ? `**Personal Reflection:** ${n.personalNote}\n` : ''
          }`
      )
      .join('\n---\n\n');

    const blob = new Blob([`# Study Notes: ${lessonTitle}\n\n${content}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Study_Notes_${lessonTitle.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.personalNote && n.personalNote.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // If minimized or closed, handled by parent/dock tab
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
        title="Drag left or right to resize notes drawer"
      >
        <div className="w-[3px] h-8 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-[#0082fb] transition-colors" />
      </div>

      {/* Drawer Header Deck */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950 text-white border-b border-slate-800 flex items-center justify-between shadow-xs select-none">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0082fb] to-cyan-400 p-[1.5px] shadow-sm shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-sky-400">
              <BookMarked className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold tracking-tight text-white truncate">Study Notes Ledger</h3>
            <p className="text-[10px] text-sky-300 font-mono truncate">
              {notes.length} saved concept{notes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Controls: Export, Minimize, Close */}
        <div className="flex items-center space-x-1 text-slate-400">
          {notes.length > 0 && (
            <button
              type="button"
              onClick={handleExportNotes}
              title="Export Notes as Markdown"
              className="skeuo-icon-btn p-1.5 w-7 h-7 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
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
            title="Close Notes"
            className="skeuo-icon-btn p-1.5 w-7 h-7 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search & Revision Banner */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-white/5 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved notes..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0082fb]"
          />
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>Revise these key excerpts before starting your assessment.</span>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 [scrollbar-width:thin]">
        {filteredNotes.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <BookmarkPlus className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-semibold">No notes saved yet.</p>
            <p className="text-[11px] max-w-xs mx-auto leading-relaxed">
              Select or highlight text in the lesson material, then click <strong className="text-[#0082fb]">+ Add</strong> to save key concepts here.
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="skeuo-card p-3 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-white/10 space-y-2.5 shadow-xs transition-all hover:border-[#0082fb]/40"
            >
              {/* Excerpt Quote */}
              <div className="relative pl-3 border-l-2 border-[#0082fb] py-0.5">
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-serif italic">
                  "{note.text}"
                </p>
              </div>

              {/* Personal Reflection Input */}
              <div className="space-y-1">
                <textarea
                  value={note.personalNote || ''}
                  onChange={(e) => onUpdateNote(note.id, e.target.value)}
                  placeholder="Add your personal reflection or mnemonic..."
                  rows={2}
                  className="w-full p-2 text-[11px] rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#0082fb] resize-none leading-relaxed"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5 text-[10px] text-slate-400 font-mono">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{note.createdAt}</span>
                </div>

                <div className="flex items-center space-x-1">
                  {onExplainSnippet && (
                    <button
                      type="button"
                      onClick={() => onExplainSnippet(note.text)}
                      title="Explain this excerpt with AI"
                      className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-[#0082fb] dark:text-sky-300 transition-colors inline-flex items-center gap-1 cursor-pointer font-sans text-[10px]"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Explain</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopy(note.id, note.text)}
                    title="Copy excerpt"
                    className="p-1 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedId === note.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteNote(note.id)}
                    title="Delete note"
                    className="p-1 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};


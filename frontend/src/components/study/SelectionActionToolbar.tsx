import React, { useState } from 'react';
import { BookmarkPlus, Highlighter, Sparkles, X } from 'lucide-react';

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

export interface SelectionRangeInfo {
  text: string;
  rect: DOMRect;
}

interface SelectionActionToolbarProps {
  selectionInfo: SelectionRangeInfo | null;
  onAddNote: (text: string) => void;
  onHighlight: (text: string, color: HighlightColor) => void;
  onExplain: (text: string) => void;
  onClearSelection: () => void;
}

const COLOR_CONFIG: Record<HighlightColor, { label: string; bgClass: string; dotClass: string }> = {
  yellow: { label: 'Yellow (Core Concept)', bgClass: 'bg-amber-300 hover:bg-amber-400', dotClass: 'bg-amber-400' },
  green: { label: 'Green (Key Rule / Invariant)', bgClass: 'bg-emerald-300 hover:bg-emerald-400', dotClass: 'bg-emerald-400' },
  blue: { label: 'Blue (Technical Term / Formula)', bgClass: 'bg-sky-300 hover:bg-sky-400', dotClass: 'bg-sky-400' },
  pink: { label: 'Pink (Important / Exam Alert)', bgClass: 'bg-pink-300 hover:bg-pink-400', dotClass: 'bg-pink-400' },
};

export const SelectionActionToolbar: React.FC<SelectionActionToolbarProps> = ({
  selectionInfo,
  onAddNote,
  onHighlight,
  onExplain,
  onClearSelection,
}) => {
  const [showColorPalette, setShowColorPalette] = useState(false);

  if (!selectionInfo || !selectionInfo.text.trim()) {
    return null;
  }

  // Calculate floating position above the selection (viewport-relative for fixed positioning)
  const rect = selectionInfo.rect;
  const toolbarWidth = 280;
  const toolbarHeight = 44;

  let top = rect.top - toolbarHeight - 12;
  let left = rect.left + rect.width / 2 - toolbarWidth / 2;

  // If too close to viewport top (e.g. under top nav header ~64px), place below selection
  const isPlacedBelow = top < 64;
  if (isPlacedBelow) {
    top = rect.bottom + 12;
  }
  // Clamp within viewport horizontal boundaries
  if (left < 10) left = 10;
  if (left + toolbarWidth > window.innerWidth - 10) {
    left = Math.max(10, window.innerWidth - toolbarWidth - 10);
  }
  // Clamp within viewport bottom boundary
  if (top + toolbarHeight > window.innerHeight - 10) {
    top = Math.max(64, window.innerHeight - toolbarHeight - 10);
  }

  return (
    <div
      style={{
        top: `${Math.round(top)}px`,
        left: `${Math.round(left)}px`,
      }}
      className="selection-toolbar-root fixed z-50 select-none animate-in fade-in zoom-in-95 duration-150"
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="skeuo-card flex items-center gap-1 p-1 bg-white dark:bg-[#0c121e] border border-slate-300 dark:border-white/15 rounded-full shadow-2xl backdrop-blur-md">
        {/* 1. Add to Notes Button */}
        <button
          type="button"
          onClick={() => {
            onAddNote(selectionInfo.text);
            setShowColorPalette(false);
          }}
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          title="Add selected text to your Study Notes ledger"
        >
          <BookmarkPlus className="w-3.5 h-3.5 text-[#0082fb] group-hover:scale-110 transition-transform" />
          <span>Add</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10" />

        {/* 2. Highlight Button & Color Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPalette(!showColorPalette)}
            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              showColorPalette
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
            title="Highlight text with academic colors"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
            <span>Highlight</span>
          </button>

          {/* Palette Popover */}
          {showColorPalette && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className={`absolute left-1/2 -translate-x-1/2 ${
                isPlacedBelow ? 'top-full mt-2' : 'bottom-full mb-2'
              } p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl flex items-center gap-1.5 z-50`}
            >
              {(Object.keys(COLOR_CONFIG) as HighlightColor[]).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    onHighlight(selectionInfo.text, color);
                    setShowColorPalette(false);
                  }}
                  className={`w-6 h-6 rounded-full ${COLOR_CONFIG[color].bgClass} border border-black/10 dark:border-white/20 hover:scale-115 active:scale-95 transition-transform cursor-pointer shadow-xs`}
                  title={COLOR_CONFIG[color].label}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10" />

        {/* 3. AI Explain Button */}
        <button
          type="button"
          onClick={() => {
            onExplain(selectionInfo.text);
            setShowColorPalette(false);
          }}
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-sky-500/10 to-indigo-500/10 hover:from-sky-500/20 hover:to-indigo-500/20 text-[#0082fb] dark:text-sky-300 text-xs font-bold transition-all cursor-pointer"
          title="Explain this concept with Gemini AI definitions & examples"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-pulse group-hover:scale-110 transition-transform" />
          <span>Explain</span>
        </button>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          title="Dismiss toolbar"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};


// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  SelectionActionToolbar,
  SelectionRangeInfo,
} from '../components/study/SelectionActionToolbar';
import { LessonNotesDrawer, StudyNote } from '../components/study/LessonNotesDrawer';
import { LessonExplainDrawer } from '../components/study/LessonExplainDrawer';

// Mock apiClient for explanation requests
vi.mock('../services/api', () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue({
      data: {
        concept: 'B-Tree Indexing',
        explanation: '### Conceptual Definition\nA B-Tree is a self-balancing search tree.',
        provenance: 'GEMINI_ACADEMIC_EXPLAINER',
      },
    }),
  },
}));

describe('Lesson Study Companion Components (Notes, Highlights, Explain)', () => {
  it('SelectionActionToolbar renders 3 actions and triggers Add, Highlight, and Explain callbacks', () => {
    const onAddNote = vi.fn();
    const onHighlight = vi.fn();
    const onExplain = vi.fn();
    const onClear = vi.fn();

    const selectionInfo: SelectionRangeInfo = {
      text: 'PostgreSQL B-Tree index optimization',
      rect: {
        top: 200,
        left: 150,
        width: 120,
        height: 20,
        bottom: 220,
        right: 270,
        x: 150,
        y: 200,
        toJSON: () => ({}),
      },
    };

    render(
      <SelectionActionToolbar
        selectionInfo={selectionInfo}
        onAddNote={onAddNote}
        onHighlight={onHighlight}
        onExplain={onExplain}
        onClearSelection={onClear}
      />
    );

    // 1. Check that Add, Highlight, and Explain buttons exist
    const addBtn = screen.getByRole('button', { name: /Add/i });
    const highlightBtn = screen.getByRole('button', { name: /Highlight/i });
    const explainBtn = screen.getByRole('button', { name: /Explain/i });

    expect(addBtn).toBeInTheDocument();
    expect(highlightBtn).toBeInTheDocument();
    expect(explainBtn).toBeInTheDocument();

    // 2. Click Add button
    fireEvent.click(addBtn);
    expect(onAddNote).toHaveBeenCalledWith('PostgreSQL B-Tree index optimization');

    // 3. Click Highlight button to open palette, then click a color swatch
    fireEvent.click(highlightBtn);
    const yellowSwatch = screen.getByTitle(/Yellow \(Core Concept\)/i);
    expect(yellowSwatch).toBeInTheDocument();
    fireEvent.click(yellowSwatch);
    expect(onHighlight).toHaveBeenCalledWith('PostgreSQL B-Tree index optimization', 'yellow');

    // 4. Click Explain button
    fireEvent.click(explainBtn);
    expect(onExplain).toHaveBeenCalledWith('PostgreSQL B-Tree index optimization');
  });

  it('LessonNotesDrawer renders saved notes, allows editing reflections, and handles deletion', () => {
    const onClose = vi.fn();
    const onToggleMinimize = vi.fn();
    const onUpdateNote = vi.fn();
    const onDeleteNote = vi.fn();

    const notes: StudyNote[] = [
      {
        id: 'note-1',
        lessonId: 'lesson-1',
        text: 'Composite indexes must follow the leftmost prefix rule.',
        personalNote: 'Crucial for multi-tenant queries',
        createdAt: '02:30 PM',
      },
    ];

    render(
      <LessonNotesDrawer
        isOpen={true}
        isMinimized={false}
        notes={notes}
        lessonTitle="1.1 Database Indexing"
        onClose={onClose}
        onToggleMinimize={onToggleMinimize}
        onUpdateNote={onUpdateNote}
        onDeleteNote={onDeleteNote}
      />
    );

    // Verify notes title & saved excerpt
    expect(screen.getByText(/Study Notes Ledger/i)).toBeInTheDocument();
    expect(screen.getByText(/Composite indexes must follow the leftmost prefix rule/i)).toBeInTheDocument();

    // Edit reflection note
    const textarea = screen.getByPlaceholderText(/Add your personal reflection/i);
    fireEvent.change(textarea, { target: { value: 'Updated revision reflection' } });
    expect(onUpdateNote).toHaveBeenCalledWith('note-1', 'Updated revision reflection');

    // Delete note
    const deleteBtn = screen.getByTitle(/Delete note/i);
    fireEvent.click(deleteBtn);
    expect(onDeleteNote).toHaveBeenCalledWith('note-1');

    // Minimize drawer
    const minimizeBtn = screen.getByTitle(/Minimize to side dock/i);
    fireEvent.click(minimizeBtn);
    expect(onToggleMinimize).toHaveBeenCalled();
  });

  it('LessonExplainDrawer displays selected text and renders structured explanation', async () => {
    const onClose = vi.fn();
    const onToggleMinimize = vi.fn();

    render(
      <LessonExplainDrawer
        isOpen={true}
        isMinimized={false}
        selectedText="FlashAttention online softmax tiling"
        lessonTitle="1.1 Attention Optimization"
        lessonId="lesson-5"
        courseId="course-5"
        onClose={onClose}
        onToggleMinimize={onToggleMinimize}
      />
    );

    // Verify header and inspected selection
    expect(screen.getByText(/AI Concept Explainer/i)).toBeInTheDocument();
    expect(screen.getByText(/"FlashAttention online softmax tiling"/i)).toBeInTheDocument();

    // Wait for explanation API response to render
    await waitFor(() => {
      expect(screen.getByText(/A B-Tree is a self-balancing search tree/i)).toBeInTheDocument();
    });
  });
});


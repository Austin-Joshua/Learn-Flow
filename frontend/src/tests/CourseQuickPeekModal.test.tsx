// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CourseQuickPeekModal } from '../components/course/CourseQuickPeekModal';
import { Course } from '../types';

describe('CourseQuickPeekModal Component', () => {
  const mockCourse: Course = {
    id: 'course-c-sys',
    title: 'C Systems Programming & Memory Architecture',
    slug: 'c-programming-systems',
    description: 'Master foundational and low-level C: pointer arithmetic, manual memory management with malloc/free, and POSIX system calls.',
    difficulty: 'beginner',
    status: 'published',
    instructor_id: 'inst-1',
    progress_percentage: 25.0,
    modules: [
      {
        id: 'mod-1',
        course_id: 'course-c-sys',
        title: 'Module 1: C Toolchain, Syntax & Memory Model',
        order_index: 1,
        lessons: [
          {
            id: 'les-1',
            course_id: 'course-c-sys',
            module_id: 'mod-1',
            title: '1.1 The GCC/Clang Toolchain',
            content_type: 'text',
            duration_minutes: 25,
            order_index: 1,
          },
          {
            id: 'les-2',
            course_id: 'course-c-sys',
            module_id: 'mod-1',
            title: '1.2 Memory Alignment & Padding',
            content_type: 'text',
            duration_minutes: 30,
            order_index: 2,
          }
        ]
      }
    ]
  };

  it('renders overview with progress and description when initialTab is continue', () => {
    const onClose = vi.fn();
    const onContinue = vi.fn();
    const onViewSyllabus = vi.fn();

    render(
      <CourseQuickPeekModal
        course={mockCourse}
        isOpen={true}
        initialTab="continue"
        onClose={onClose}
        onContinue={onContinue}
        onViewSyllabus={onViewSyllabus}
      />
    );

    expect(screen.getByText('C Systems Programming & Memory Architecture')).toBeInTheDocument();
    expect(screen.getByText('25% Completed')).toBeInTheDocument();
    expect(screen.getByText(/pointer arithmetic, manual memory management/i)).toBeInTheDocument();

    const continueBtn = screen.getByRole('button', { name: /Continue Learning/i });
    expect(continueBtn).toBeInTheDocument();
    fireEvent.click(continueBtn);
    expect(onContinue).toHaveBeenCalledWith(mockCourse);
  });

  it('renders syllabus hierarchy when switched to syllabus tab', () => {
    const onClose = vi.fn();
    const onContinue = vi.fn();
    const onViewSyllabus = vi.fn();

    render(
      <CourseQuickPeekModal
        course={mockCourse}
        isOpen={true}
        initialTab="syllabus"
        onClose={onClose}
        onContinue={onContinue}
        onViewSyllabus={onViewSyllabus}
      />
    );

    expect(screen.getByText('Module 1: C Toolchain, Syntax & Memory Model')).toBeInTheDocument();
    expect(screen.getByText('1.1 The GCC/Clang Toolchain')).toBeInTheDocument();

    const fullSyllabusBtn = screen.getByRole('button', { name: /Full Syllabus Page/i });
    expect(fullSyllabusBtn).toBeInTheDocument();
    fireEvent.click(fullSyllabusBtn);
    expect(onViewSyllabus).toHaveBeenCalledWith(mockCourse);
  });

  it('handles close callback on close button click', () => {
    const onClose = vi.fn();
    render(
      <CourseQuickPeekModal
        course={mockCourse}
        isOpen={true}
        onClose={onClose}
        onContinue={vi.fn()}
        onViewSyllabus={vi.fn()}
      />
    );

    const closeBtn = screen.getByLabelText('Close modal');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});

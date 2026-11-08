import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QuestionAuthoringModal } from '../components/curriculum/QuestionAuthoringModal';
import { LessonResourcesModal } from '../components/curriculum/LessonResourcesModal';
import { CompletionCriteriaModal } from '../components/curriculum/CompletionCriteriaModal';
import { CohortAnalyticsPage } from '../pages/CohortAnalyticsPage';
import { CourseDetailPage } from '../pages/CourseDetailPage';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

// Mock the API module while preserving exports like subscribeAuthSync
vi.mock('../services/api', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    api: {
      ...((actual.api as Record<string, unknown>) || {}),
      courses: {
        getDetail: vi.fn(),
        getById: vi.fn(),
        getAssessments: vi.fn(),
        enroll: vi.fn(),
      },
      enrollments: {
        myCourses: vi.fn(),
      },
      assignments: {
        listForCourse: vi.fn(),
        uploadSubmission: vi.fn(),
      },
      curriculum: {
        listResources: vi.fn(),
        getResourceUploadUrl: vi.fn(),
        registerResource: vi.fn(),
        deleteResource: vi.fn(),
        getDownloadUrl: vi.fn(),
      },
      certificates: {
        getCompletionCriteria: vi.fn(),
        updateCompletionCriteria: vi.fn(),
        getCompletionStatus: vi.fn(),
        claim: vi.fn(),
      },
      analytics: {
        getCourseAnalytics: vi.fn(),
        getCourseAtRisk: vi.fn(),
      },
    },
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

describe('1. QuestionAuthoringModal - Client-side validation per question type', () => {
  const mockOnSubmit = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects prompts with fewer than 3 characters', async () => {
    render(
      <QuestionAuthoringModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const promptInput = screen.getByPlaceholderText(/Which consensus protocol/i);
    fireEvent.change(promptInput, { target: { value: 'ab' } });

    const form = promptInput.closest('form')!;
    fireEvent.submit(form);

    expect(await screen.findByText('Question prompt must be at least 3 characters.')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('rejects points less than or equal to 0', async () => {
    render(
      <QuestionAuthoringModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const promptInput = screen.getByPlaceholderText(/Which consensus protocol/i);
    fireEvent.change(promptInput, { target: { value: 'Valid question prompt?' } });

    const pointsInput = screen.getByRole('spinbutton');
    fireEvent.change(pointsInput, { target: { value: '-1' } });

    const form = promptInput.closest('form')!;
    fireEvent.submit(form);

    expect(await screen.findByText('Points must be greater than 0.')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates single choice question requires exactly one correct option and non-empty text', async () => {
    render(
      <QuestionAuthoringModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const promptInput = screen.getByPlaceholderText(/Which consensus protocol/i);
    fireEvent.change(promptInput, { target: { value: 'What is O(1) complexity?' } });

    const form = promptInput.closest('form')!;

    // Empty option text validation
    fireEvent.submit(form);
    expect(await screen.findByText('All option choices must have non-empty text.')).toBeInTheDocument();

    const optionInputs = screen.getAllByPlaceholderText(/Option \d+/i);
    fireEvent.change(optionInputs[0], { target: { value: 'Constant' } });
    fireEvent.change(optionInputs[1], { target: { value: 'Linear' } });

    // By default Option 1 is correct. Submit successfully
    fireEvent.submit(form);
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'What is O(1) complexity?',
        question_type: 'single_choice',
        points: 1,
        options: [
          { option_text: 'Constant', is_correct: true, order_index: 1 },
          { option_text: 'Linear', is_correct: false, order_index: 2 },
        ],
      })
    );
  });

  it('validates multiple choice question requires at least one correct option', async () => {
    render(
      <QuestionAuthoringModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const [typeSelect] = screen.getAllByRole('combobox');
    fireEvent.change(typeSelect, { target: { value: 'multiple_choice' } });

    const promptInput = screen.getByPlaceholderText(/Which consensus protocol/i);
    fireEvent.change(promptInput, { target: { value: 'Select all SQL commands:' } });

    const optionInputs = screen.getAllByPlaceholderText(/Option \d+/i);
    fireEvent.change(optionInputs[0], { target: { value: 'SELECT' } });
    fireEvent.change(optionInputs[1], { target: { value: 'UPDATE' } });

    // Deselect option 0 so 0 correct options are selected
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // was true -> becomes false

    const form = promptInput.closest('form')!;
    fireEvent.submit(form);

    expect(await screen.findByText('Multiple choice question must have at least one correct option.')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates true/false question initializes exactly two options with one correct answer', async () => {
    render(
      <QuestionAuthoringModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const [typeSelect] = screen.getAllByRole('combobox');
    fireEvent.change(typeSelect, { target: { value: 'true_false' } });

    const promptInput = screen.getByPlaceholderText(/Which consensus protocol/i);
    fireEvent.change(promptInput, { target: { value: 'PostgreSQL supports ACID transactions.' } });

    // Check that True and False options are present
    expect(screen.getByDisplayValue('True')).toBeInTheDocument();
    expect(screen.getByDisplayValue('False')).toBeInTheDocument();

    const form = promptInput.closest('form')!;
    fireEvent.submit(form);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'PostgreSQL supports ACID transactions.',
        question_type: 'true_false',
        options: [
          { option_text: 'True', is_correct: true, order_index: 1 },
          { option_text: 'False', is_correct: false, order_index: 2 },
        ],
      })
    );
  });

  it('validates short answer question requires at least one accepted answer variant', async () => {
    render(
      <QuestionAuthoringModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const [typeSelect] = screen.getAllByRole('combobox');
    fireEvent.change(typeSelect, { target: { value: 'short_answer' } });

    const promptInput = screen.getByPlaceholderText(/Which consensus protocol/i);
    fireEvent.change(promptInput, { target: { value: 'Name the HTTP method used for safe, idempotent reads.' } });

    const form = promptInput.closest('form')!;

    // Leave accepted answers empty and try to submit
    fireEvent.submit(form);

    expect(await screen.findByText('Short answer question must have at least one accepted answer variant.')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Now fill accepted answer variants
    const acceptedInput = screen.getByPlaceholderText(/e\.g\. Raft, raft consensus, RAFT/i);
    fireEvent.change(acceptedInput, { target: { value: 'GET, get' } });

    fireEvent.submit(form);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'Name the HTTP method used for safe, idempotent reads.',
        question_type: 'short_answer',
        accepted_answers: ['GET', 'get'],
      })
    );
  });
});

describe('2. Assignment Upload States on CourseDetailPage', () => {
  const mockCourse = {
    id: 'c-101',
    title: 'Distributed Systems & Cloud Computing',
    description: 'Learn modern distributed consensus and microservices.',
    is_enrolled: true,
    progress_percentage: 45,
    modules: [],
  };

  const mockAssignments = [
    {
      id: 'asgn-1',
      course_id: 'c-101',
      title: 'Raft Consensus Implementation',
      description: 'Implement leader election and log replication.',
      due_date: '2026-12-31T23:59:59Z',
      allowed_extensions: 'zip,tar.gz',
      submission_status: 'not_submitted',
      max_points: 100,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'u-1',
        email: 'learner@learnflow.edu',
        first_name: 'Test',
        last_name: 'Learner',
        full_name: 'Test Learner',
        is_active: true,
        roles: [{ id: 1, name: 'learner', description: 'Learner' }],
      },
    });

    (api.courses.getDetail as any).mockResolvedValue({ data: mockCourse });
    (api.enrollments.myCourses as any).mockResolvedValue({ data: [{ id: 'c-101', progress_percentage: 45 }] });
    (api.courses.getAssessments as any).mockResolvedValue({ data: [] });
    (api.assignments.listForCourse as any).mockResolvedValue({ data: mockAssignments });
    (api.certificates.getCompletionStatus as any).mockResolvedValue({
      data: {
        is_completed: false,
        is_eligible: false,
        version: 1,
        lessons_passed: false,
        actual_lesson_completion_pct: 45,
        min_lesson_completion_pct: 100,
        required_assessments: [],
        required_assignments: [],
        missing_requirements: [],
      },
    });
  });

  it('renders idle upload state, handles submission progression, and shows success banner', async () => {
    (api.assignments.uploadSubmission as any).mockImplementation(
      async (_id: string, _file: File, _ext: string, _notes: string, onProgress?: (msg: string) => void) => {
        if (onProgress) {
          onProgress('Validating file integrity and virus scan signature...');
        }
        return { data: { id: 'sub-1', status: 'quarantined' } };
      }
    );

    render(
      <MemoryRouter initialEntries={['/courses/c-101']}>
        <Routes>
          <Route path="/courses/:id" element={<CourseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for assignments section to load
    expect(await screen.findByText('Raft Consensus Implementation')).toBeInTheDocument();

    // Click "Submit Assignment" button to open modal
    const submitBtn = screen.getByRole('button', { name: /Submit Assignment/i });
    fireEvent.click(submitBtn);

    // Verify modal is open in idle state
    expect(screen.getByText('S3 Quarantine Upload Pipeline')).toBeInTheDocument();
    expect(screen.getByText(/Permitted formats:/i)).toBeInTheDocument();

    // Submit button should be disabled when no file is selected
    const quarantineSubmitBtn = screen.getByRole('button', { name: /Submit to Quarantine/i });
    expect(quarantineSubmitBtn).toBeDisabled();

    // Select a file
    const file = new File(['package main'], 'consensus.zip', { type: 'application/zip' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Submit button is now enabled
    expect(quarantineSubmitBtn).not.toBeDisabled();

    // Submit the form
    fireEvent.click(quarantineSubmitBtn);

    // Verify success banner appears
    expect(
      await screen.findByText('Submission successfully uploaded and verified by quarantine inspection.')
    ).toBeInTheDocument();
    expect(api.assignments.uploadSubmission).toHaveBeenCalled();
  });

  it('displays error state when submission upload fails quarantine check', async () => {
    (api.assignments.uploadSubmission as any).mockRejectedValue(
      new Error('Quarantine scan rejected suspicious file: infected with malware.')
    );

    render(
      <MemoryRouter initialEntries={['/courses/c-101']}>
        <Routes>
          <Route path="/courses/:id" element={<CourseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Raft Consensus Implementation')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Submit Assignment/i }));

    const file = new File(['bad payload'], 'bad.zip', { type: 'application/zip' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /Submit to Quarantine/i }));

    // Verify error banner is rendered
    expect(
      await screen.findByText('Quarantine scan rejected suspicious file: infected with malware.')
    ).toBeInTheDocument();
  });
});

describe('3. LessonResourcesModal - Resources list and download link', () => {
  const mockLesson = {
    id: 'les-99',
    course_id: 'c-101',
    module_id: 'mod-1',
    title: 'Distributed Log Consensus',
    order_index: 1,
    is_completed: false,
  };

  const mockResources = [
    {
      id: 'res-1',
      lesson_id: 'les-99',
      title: 'Consensus Whitepaper PDF',
      file_url: 'https://s3.example.com/consensus.pdf',
      filename: 'consensus.pdf',
      file_size_bytes: 204800, // 200 KB
      created_at: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders attached resources and triggers download link via presigned URL', async () => {
    (api.curriculum.listResources as any).mockResolvedValue({ data: mockResources });
    (api.curriculum.getDownloadUrl as any).mockResolvedValue({
      data: { download_url: 'https://s3.example.com/presigned-download' },
    });

    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <LessonResourcesModal
        isOpen={true}
        lesson={mockLesson as any}
        onClose={vi.fn()}
      />
    );

    // Verify resource title and file details are rendered
    expect(await screen.findByText('Consensus Whitepaper PDF')).toBeInTheDocument();
    expect(screen.getByText(/200 KB/i)).toBeInTheDocument();

    // Click download button
    const downloadBtn = screen.getByTitle('Download');
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(api.curriculum.getDownloadUrl).toHaveBeenCalledWith('res-1');
      expect(windowOpenSpy).toHaveBeenCalledWith('https://s3.example.com/presigned-download', '_blank');
    });

    windowOpenSpy.mockRestore();
  });

  it('displays empty state when no resources are attached to the lesson', async () => {
    (api.curriculum.listResources as any).mockResolvedValue({ data: [] });

    render(
      <LessonResourcesModal
        isOpen={true}
        lesson={mockLesson as any}
        onClose={vi.fn()}
      />
    );

    expect(
      await screen.findByText('No downloadable resources attached to this lesson yet.')
    ).toBeInTheDocument();
  });
});

describe('4. CompletionCriteriaModal - Save payload structure', () => {
  const mockAssessments = [
    { id: 'assess-1', title: 'Midterm Quiz', passing_score_percentage: 70 },
    { id: 'assess-2', title: 'Final Certification Exam', passing_score_percentage: 80 },
  ];

  const mockAssignments = [
    { id: 'asgn-1', title: 'Mini-Project 1' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads criteria and submits updated payload with modified percentages and selected assessments', async () => {
    (api.certificates.getCompletionCriteria as any).mockResolvedValue({
      data: {
        course_id: 'course-123',
        min_lesson_completion_pct: 100,
        require_all_assignments: true,
        required_assessments: [{ assessment_id: 'assess-1', min_score_pct: 70 }],
        required_assignments: [],
        version: 1,
      },
    });

    (api.certificates.updateCompletionCriteria as any).mockResolvedValue({
      data: { version: 2 },
    });

    render(
      <CompletionCriteriaModal
        isOpen={true}
        courseId="course-123"
        onClose={vi.fn()}
        assessments={mockAssessments as any}
        assignments={mockAssignments as any}
      />
    );

    // Wait for criteria to load (displays v1 badge)
    expect(await screen.findByText('v1')).toBeInTheDocument();

    // Toggle the second assessment checkbox to make it required
    const finalExamLabel = screen.getByText('Final Certification Exam');
    const finalExamCheckbox = finalExamLabel.closest('div')?.querySelector('input[type="checkbox"]');
    if (finalExamCheckbox) {
      fireEvent.click(finalExamCheckbox);
    }

    // Save criteria
    const saveBtn = screen.getByRole('button', { name: /Save Completion Criteria/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.certificates.updateCompletionCriteria).toHaveBeenCalledWith(
        'course-123',
        expect.objectContaining({
          min_lesson_completion_pct: 100,
          require_all_assignments: true,
          required_assessments: expect.arrayContaining([
            expect.objectContaining({ assessment_id: 'assess-1' }),
            expect.objectContaining({ assessment_id: 'assess-2' }),
          ]),
        })
      );
    });

    expect(await screen.findByText(/Criteria updated successfully to Version 2/i)).toBeInTheDocument();
  });
});

describe('5. CohortAnalyticsPage - At-risk panel with reasons and empty state', () => {
  const mockAnalytics = {
    course_id: 'course-456',
    course_title: 'Algorithms & Data Structures',
    total_enrolled: 40,
    completed_count: 12,
    drop_off_funnel: [],
    concept_mastery: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (api.analytics.getCourseAnalytics as any).mockResolvedValue({ data: mockAnalytics });
  });

  it('renders at-risk learners with risk level, tags, and explainable intervention reasons', async () => {
    (api.analytics.getCourseAtRisk as any).mockResolvedValue({
      data: {
        course_id: 'course-456',
        course_title: 'Algorithms & Data Structures',
        total_enrolled: 40,
        at_risk_count: 1,
        learners: [
          {
            user_id: 'u-risk-1',
            full_name: 'Jordan Lee',
            email: 'jordan@learnflow.edu',
            progress_percentage: 15,
            risk_level: 'high',
            risk_reasons: [
              'No lesson completions in the last 14 days (pace stalled).',
              'Failed recent assessment attempt (scored 42%, passing is 70%).',
            ],
            risk_tags: ['BEHIND_PACE', 'ASSESSMENT_FAILED'],
            enrolled_at: '2026-01-01T00:00:00Z',
          },
        ],
      },
    });

    render(
      <MemoryRouter initialEntries={['/analytics/courses/course-456']}>
        <Routes>
          <Route path="/analytics/courses/:id" element={<CohortAnalyticsPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify learner name and email
    expect(await screen.findByText('Jordan Lee')).toBeInTheDocument();
    expect(screen.getByText(/<jordan@learnflow\.edu>/i)).toBeInTheDocument();

    // Verify risk level and tags
    expect(screen.getByText('high risk')).toBeInTheDocument();
    expect(screen.getByText('#behind-pace')).toBeInTheDocument();
    expect(screen.getByText('#assessment-failed')).toBeInTheDocument();

    // Verify explainable reason items
    expect(screen.getByText('No lesson completions in the last 14 days (pace stalled).')).toBeInTheDocument();
    expect(screen.getByText('Failed recent assessment attempt (scored 42%, passing is 70%).')).toBeInTheDocument();
  });

  it('renders healthy cohort empty state when at_risk_count is 0', async () => {
    (api.analytics.getCourseAtRisk as any).mockResolvedValue({
      data: {
        course_id: 'course-456',
        course_title: 'Algorithms & Data Structures',
        total_enrolled: 40,
        at_risk_count: 0,
        learners: [],
      },
    });

    render(
      <MemoryRouter initialEntries={['/analytics/courses/course-456']}>
        <Routes>
          <Route path="/analytics/courses/:id" element={<CohortAnalyticsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      await screen.findByText('All active cohort learners are currently on pace and in good academic standing.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('No failed attempts, missed deadlines, or pace stalls detected.')
    ).toBeInTheDocument();
  });
});

describe('6. CourseDetailPage - "Take assessment" button states', () => {
  const baseCourse = {
    id: 'course-789',
    title: 'Operating Systems Internals',
    description: 'Kernel architectures and memory management.',
    is_enrolled: true,
    progress_percentage: 60,
    modules: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'u-1',
        email: 'learner@learnflow.edu',
        first_name: 'Test',
        last_name: 'Learner',
        full_name: 'Test Learner',
        is_active: true,
        roles: [{ id: 1, name: 'learner', description: 'Learner' }],
      },
    });

    (api.courses.getDetail as any).mockResolvedValue({ data: baseCourse });
    (api.enrollments.myCourses as any).mockResolvedValue({ data: [{ id: 'course-789', progress_percentage: 60 }] });
    (api.assignments.listForCourse as any).mockResolvedValue({ data: [] });
    (api.certificates.getCompletionStatus as any).mockResolvedValue({
      data: {
        is_completed: false,
        is_eligible: false,
        version: 1,
        lessons_passed: false,
        actual_lesson_completion_pct: 60,
        min_lesson_completion_pct: 100,
        required_assessments: [],
        required_assignments: [],
        missing_requirements: [],
      },
    });
  });

  it('renders "Take assessment" link when assessment is unlocked and not started', async () => {
    (api.courses.getAssessments as any).mockResolvedValue({
      data: [
        {
          id: 'as-avail',
          course_id: 'course-789',
          title: 'Virtual Memory & Paging Quiz',
          time_limit_minutes: 20,
          passing_score_percentage: 75,
          max_attempts: 3,
          attempts_used: 0,
          best_score: null,
          status: 'not_started',
          is_locked: false,
          locked_reason: null,
          questions_count: 10,
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/courses/course-789']}>
        <Routes>
          <Route path="/courses/:id" element={<CourseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Virtual Memory & Paging Quiz')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Take assessment/i });
    expect(link).toHaveAttribute('href', '/assessments/as-avail');
  });

  it('renders "Resume" link when assessment status is in_progress', async () => {
    (api.courses.getAssessments as any).mockResolvedValue({
      data: [
        {
          id: 'as-prog',
          course_id: 'course-789',
          title: 'Concurrency & Deadlocks Quiz',
          time_limit_minutes: 30,
          passing_score_percentage: 80,
          max_attempts: 2,
          attempts_used: 1,
          best_score: null,
          status: 'in_progress',
          is_locked: false,
          locked_reason: null,
          questions_count: 15,
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/courses/course-789']}>
        <Routes>
          <Route path="/courses/:id" element={<CourseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Concurrency & Deadlocks Quiz')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Resume/i });
    expect(link).toHaveAttribute('href', '/assessments/as-prog');
  });

  it('renders "View result" link when assessment is passed', async () => {
    (api.courses.getAssessments as any).mockResolvedValue({
      data: [
        {
          id: 'as-pass',
          course_id: 'course-789',
          title: 'File Systems & Inodes Quiz',
          time_limit_minutes: 25,
          passing_score_percentage: 70,
          max_attempts: 3,
          attempts_used: 1,
          best_score: 92,
          status: 'passed',
          is_locked: false,
          locked_reason: null,
          questions_count: 10,
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/courses/course-789']}>
        <Routes>
          <Route path="/courses/:id" element={<CourseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('File Systems & Inodes Quiz')).toBeInTheDocument();
    expect(screen.getByText('Passed (92%)')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /View result/i });
    expect(link).toHaveAttribute('href', '/assessments/as-pass');
  });

  it('renders disabled "Locked" button with lock icon and plain reason when locked', async () => {
    (api.courses.getAssessments as any).mockResolvedValue({
      data: [
        {
          id: 'as-lock',
          course_id: 'course-789',
          title: 'Advanced IPC Assessment',
          time_limit_minutes: 45,
          passing_score_percentage: 80,
          max_attempts: 2,
          attempts_used: 0,
          best_score: null,
          status: 'not_started',
          is_locked: true,
          locked_reason: 'Module 3 must be completed before taking this assessment.',
          questions_count: 20,
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/courses/course-789']}>
        <Routes>
          <Route path="/courses/:id" element={<CourseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Advanced IPC Assessment')).toBeInTheDocument();
    expect(screen.getByText('Module 3 must be completed before taking this assessment.')).toBeInTheDocument();
    const lockedBtn = screen.getByRole('button', { name: /Locked/i });
    expect(lockedBtn).toBeDisabled();
  });

  it('renders "Attempts Exhausted" badge when all attempts are used without passing', async () => {
    (api.courses.getAssessments as any).mockResolvedValue({
      data: [
        {
          id: 'as-exhaust',
          course_id: 'course-789',
          title: 'Memory Management Arena',
          time_limit_minutes: 30,
          passing_score_percentage: 80,
          max_attempts: 2,
          attempts_used: 2,
          best_score: 65,
          status: 'failed',
          is_locked: false,
          locked_reason: null,
          questions_count: 15,
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/courses/course-789']}>
        <Routes>
          <Route path="/courses/:id" element={<CourseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Memory Management Arena')).toBeInTheDocument();
    expect(screen.getByText('Attempts Exhausted')).toBeInTheDocument();
  });
});

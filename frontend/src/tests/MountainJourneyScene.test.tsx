// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MountainScene } from '../components/journey/MountainScene';
import { TrailGeometry, CourseStats, ALPINE_CHECKPOINTS } from '../hooks/useJourneyData';
import { JourneyModuleItem } from '../types';

describe('MountainScene Component - Traveler Expedition & Checkpoints', () => {
  const mockModule: JourneyModuleItem = {
    id: 'mod-1',
    title: 'Module 1: Distributed Foundations',
    order_index: 0,
    is_locked: false,
    completed_lessons: 2,
    total_lessons: 4,
    lessons: [
      {
        id: 'les-1',
        module_id: 'mod-1',
        title: 'Raft Consensus Protocol',
        order_index: 0,
        duration_minutes: 20,
        content_type: 'text',
        status: 'completed',
        completed_at: '2026-10-20T10:00:00Z',
      },
      {
        id: 'les-2',
        module_id: 'mod-1',
        title: 'Leader Election Quorum',
        order_index: 1,
        duration_minutes: 25,
        content_type: 'text',
        status: 'current',
        completed_at: null,
      },
    ],
    assessment: {
      assessment_id: 'assess-1',
      title: 'Distributed Systems Laboratory Exam',
      passed: true,
      score_percentage: 92,
      attempt_count: 1,
    },
  };

  const mockTrailGeometry: TrailGeometry = {
    width: 800,
    height: 1150,
    waypoints: ALPINE_CHECKPOINTS.map((cp, idx) => ({
      id: cp.id,
      module: mockModule,
      point: { x: 230 + idx * 40, y: 1000 - idx * 120 },
      isCompleted: idx < 3,
      isCurrent: idx === 3,
      isLocked: idx > 3,
      lessons: [],
      checkpoint: cp,
      index: idx,
    })),
    segments: [
      {
        d: 'M 230 1000 C 300 950, 450 900, 570 880',
        status: 'completed',
        fromIndex: 0,
        cp1: { x: 300, y: 950 },
        cp2: { x: 450, y: 900 },
        fromPoint: { x: 230, y: 1000 },
        toPoint: { x: 570, y: 880 },
      },
    ],
    summitPoint: { x: 400, y: 120 },
    mountainContours: ['M 50 1150 L 400 80 L 750 1150 Z'],
    travelerPoint: { x: 550, y: 620 },
    currentElevation: 2800,
    currentCheckpointIndex: 3,
    trailDistanceKm: 7.4,
    totalKnowledgeXp: 2900,
    earnedKnowledgeXp: 700,
    progressPercentage: 50,
  };

  const mockCourseStats: CourseStats = {
    totalLessons: 4,
    completedLessons: 2,
    totalModules: 1,
    completedModules: 0,
  };

  it('renders expedition telemetry HUD with current elevation and knowledge progress', () => {
    const onSelectModule = vi.fn();
    const onNavigate = vi.fn();

    render(
      <MountainScene
        trailGeometry={mockTrailGeometry}
        courseStats={mockCourseStats}
        selectedModuleId="mod-1"
        activeModule={mockModule}
        onSelectModule={onSelectModule}
        onNavigate={onNavigate}
      />
    );

    // Telemetry stats
    expect(screen.getAllByText(/2800m/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Peak Summit: 5,200m')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('3 / 7')).toBeInTheDocument();
    expect(screen.getByText('700 XP')).toBeInTheDocument();
  });

  it('renders traveler hiking marker with YOU ARE HERE indicator and checkpoints', () => {
    const onSelectModule = vi.fn();
    const onNavigate = vi.fn();

    render(
      <MountainScene
        trailGeometry={mockTrailGeometry}
        courseStats={mockCourseStats}
        selectedModuleId={null}
        activeModule={null}
        onSelectModule={onSelectModule}
        onNavigate={onNavigate}
      />
    );

    expect(screen.getByText(/YOU ARE HERE/i)).toBeInTheDocument();
    expect(screen.getAllByText(/5,200m/i).length).toBeGreaterThanOrEqual(1);

    // Verify checkpoints are present in DOM
    expect(screen.getAllByText(/Valley Basecamp/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Pine Hollow/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Cascading Falls/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Timberline Vista/i).length).toBeGreaterThanOrEqual(1);
  });

  it('clicking a checkpoint opens the Checkpoint Reward Dossier with XP and skills', () => {
    const onSelectModule = vi.fn();
    const onNavigate = vi.fn();

    render(
      <MountainScene
        trailGeometry={mockTrailGeometry}
        courseStats={mockCourseStats}
        selectedModuleId={null}
        activeModule={null}
        onSelectModule={onSelectModule}
        onNavigate={onNavigate}
      />
    );

    // Click Checkpoint 2 (Pine Hollow Shelter)
    const cp2Button = screen.getByLabelText(/Checkpoint 2: Pine Hollow Shelter/i);
    fireEvent.click(cp2Button);

    expect(onSelectModule).toHaveBeenCalledWith('mod-1');
    expect(screen.getAllByText(/Pine Hollow Shelter/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Foundations Badge/i)).toBeInTheDocument();
    expect(screen.getByText(/\+150 Knowledge XP/i)).toBeInTheDocument();
  });

  it('clicking the Summit button triggers navigation to certificates page', () => {
    const onSelectModule = vi.fn();
    const onNavigate = vi.fn();

    render(
      <MountainScene
        trailGeometry={mockTrailGeometry}
        courseStats={mockCourseStats}
        selectedModuleId={null}
        activeModule={null}
        onSelectModule={onSelectModule}
        onNavigate={onNavigate}
      />
    );

    const summitButton = screen.getByRole('button', {
      name: /The Pinnacle of Knowledge Summit: Claim Verified Institutional Diploma/i,
    });
    fireEvent.click(summitButton);

    expect(onNavigate).toHaveBeenCalledWith('/my-certificates');
  });
});

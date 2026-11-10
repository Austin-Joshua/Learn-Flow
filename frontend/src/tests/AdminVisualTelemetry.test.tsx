import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { useAuthStore } from '../store/authStore';

const { mockUsers, mockAuditLogs, mockCourses, mockOverview } = vi.hoisted(() => {
  const users = [
    {
      id: 'usr-admin-1',
      email: 'admin@learnflow.edu',
      first_name: 'Dr. System',
      last_name: 'Administrator',
      full_name: 'Dr. System Administrator',
      is_active: true,
      roles: [{ id: 1, name: 'admin' }],
    },
    {
      id: 'usr-faculty-1',
      email: 'faculty@learnflow.edu',
      first_name: 'Alan',
      last_name: 'Turing',
      full_name: 'Prof. Alan Turing',
      is_active: true,
      roles: [{ id: 2, name: 'instructor' }],
    },
    {
      id: 'usr-student-1',
      email: 'student@learnflow.edu',
      first_name: 'Ada',
      last_name: 'Lovelace',
      full_name: 'Ada Lovelace',
      is_active: true,
      roles: [{ id: 3, name: 'learner' }],
    },
    {
      id: 'usr-disabled-1',
      email: 'suspended@learnflow.edu',
      first_name: 'Locked',
      last_name: 'Student',
      full_name: 'Locked Student',
      is_active: false,
      roles: [{ id: 3, name: 'learner' }],
    },
  ];

  const auditLogs = [
    {
      id: 'log-1-auth',
      action: 'LOGIN_SUCCESS',
      entity_type: 'USER',
      entity_id: 'usr-student-1',
      ip_address: '192.168.1.1',
      created_at: new Date().toISOString(),
    },
    {
      id: 'log-2-role',
      action: 'ROLE_ASSIGNED',
      entity_type: 'ROLE',
      entity_id: 'usr-faculty-1',
      ip_address: '10.0.0.1',
      created_at: new Date().toISOString(),
    },
    {
      id: 'log-3-cert',
      action: 'CERTIFICATE_MINTED',
      entity_type: 'CERTIFICATE',
      entity_id: 'cert-789',
      ip_address: 'internal',
      created_at: new Date().toISOString(),
    },
    {
      id: 'log-4-course',
      action: 'COURSE_PUBLISHED',
      entity_type: 'COURSE',
      entity_id: 'course-101',
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    },
  ];

  const courses = [
    {
      id: 'course-1',
      title: 'Distributed Systems & Consensus',
      description: 'Raft and Paxos distributed algorithms',
      difficulty: 'advanced',
      status: 'published',
      enrolled_count: 42,
      modules: [{ id: 'm1', title: 'Module 1' }],
    },
    {
      id: 'course-2',
      title: 'Intro to Python Systems',
      description: 'Fundamental algorithmic structures',
      difficulty: 'beginner',
      status: 'published',
      enrolled_count: 120,
      modules: [{ id: 'm1', title: 'Module 1' }],
    },
  ];

  const overview = {
    total_users: 4,
    total_courses: 2,
    total_enrollments: 162,
    recent_audit_logs: auditLogs,
  };

  return { mockUsers: users, mockAuditLogs: auditLogs, mockCourses: courses, mockOverview: overview };
});

vi.mock('../services/api', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    api: {
      ...((actual.api as Record<string, unknown>) || {}),
      users: {
        list: vi.fn().mockResolvedValue({ data: mockUsers }),
        assignRole: vi.fn().mockResolvedValue({ message: 'Role assigned' }),
        toggleActive: vi.fn().mockResolvedValue({ message: 'Status updated' }),
      },
      system: {
        getAuditLogs: vi.fn().mockResolvedValue({ data: mockAuditLogs }),
      },
      analytics: {
        getOverview: vi.fn().mockResolvedValue({ data: mockOverview }),
      },
      courses: {
        list: vi.fn().mockResolvedValue({ data: mockCourses }),
      },
    },
  };
});

describe('AdminDashboardPage - Rich Visual Telemetry & Operations Center', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: mockUsers[0],
      token: 'admin-token',
      isAuthenticated: true,
    });
  });

  it('renders top Visual Intelligence Telemetry Deck with Role Demographics, Tier Depth, and Health Ring Gauges', async () => {
    render(
      <BrowserRouter>
        <AdminDashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Admin Portal & Institutional Oversight/i)).toBeInTheDocument();
    });

    // Role Demographics
    expect(screen.getByText('Role Demographics')).toBeInTheDocument();
    expect(screen.getByText('Faculty')).toBeInTheDocument();

    // Curriculum Tier Depth
    expect(screen.getByText('Curriculum Tier Depth')).toBeInTheDocument();
    expect(screen.getByText(/Beginner Tier/i)).toBeInTheDocument();
    expect(screen.getByText(/Intermediate Tier/i)).toBeInTheDocument();
    expect(screen.getByText(/Advanced \/ Specialist/i)).toBeInTheDocument();

    // Real-Time System Vitals SVG Ring Gauges
    expect(screen.getByText('Real-Time System Vitals')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('Redis Cache')).toBeInTheDocument();
    expect(screen.getByText('HMAC Vault')).toBeInTheDocument();
    expect(screen.getByText('S3 Pipeline')).toBeInTheDocument();
  });

  it('renders Tab 1 User Directory Quick-Stats Deck with Active Learners, Faculty, and Admin cards', async () => {
    render(
      <BrowserRouter>
        <AdminDashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Active Learners')).toBeInTheDocument();
    });

    expect(screen.getByText('Faculty Instructors')).toBeInTheDocument();
    expect(screen.getByText('Platform Admin')).toBeInTheDocument();
    expect(screen.getByText('Suspended / Inactive')).toBeInTheDocument();
  });

  it('renders Tab 3 with Event Velocity Categorization and Chained Hash Integrity Blocks', async () => {
    render(
      <BrowserRouter>
        <AdminDashboardPage />
      </BrowserRouter>
    );

    // Switch to Cryptographic Ledger tab
    const auditTabBtn = await screen.findByRole('button', { name: /Cryptographic Ledger/i });
    fireEvent.click(auditTabBtn);

    // Verify Velocity Deck
    expect(await screen.findByText('Audit Event Velocity & Classification')).toBeInTheDocument();
    expect(screen.getByText('Auth & Login')).toBeInTheDocument();
    expect(screen.getByText('RBAC Governance')).toBeInTheDocument();
    expect(screen.getByText('Certificates')).toBeInTheDocument();

    // Verify Chained Hash Sequence Blocks
    expect(screen.getByText(/Recent Chained Hash Blocks \(Non-Repudiation Stream\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/IMMUTABLE/i).length).toBeGreaterThan(0);
  });

  it('renders Tab 4 System Infrastructure with 30-Day Availability Ribbon and Microservice Pipeline Topology', async () => {
    render(
      <BrowserRouter>
        <AdminDashboardPage />
      </BrowserRouter>
    );

    // Switch to System Infrastructure tab
    const infraTabBtn = await screen.findByRole('button', { name: /System Infrastructure/i });
    fireEvent.click(infraTabBtn);

    // Verify 30-Day Availability Ribbon
    expect(await screen.findByText('30-Day Institutional System Availability Ribbon')).toBeInTheDocument();
    expect(screen.getByText(/99\.994% Uptime/i)).toBeInTheDocument();
    expect(screen.getByText(/Mean Time to Detect \(MTTD\)/i)).toBeInTheDocument();

    // Verify Microservice Architecture & Topology
    expect(screen.getByText('Microservice Architecture & Data Pipeline Topology')).toBeInTheDocument();
    expect(screen.getByText(/01 \/ Edge Ingress/i)).toBeInTheDocument();
    expect(screen.getByText(/02 \/ Real-Time Storage/i)).toBeInTheDocument();
    expect(screen.getByText(/03 \/ Security & Quarantine/i)).toBeInTheDocument();

    // Verify 4 Service Node Cards with live Telemetry resource meters
    expect(screen.getByText(/RAM: 342 MB \/ 1024 MB/i)).toBeInTheDocument();
    expect(screen.getByText(/RAM: 68 MB \/ 512 MB/i)).toBeInTheDocument();
  });
});

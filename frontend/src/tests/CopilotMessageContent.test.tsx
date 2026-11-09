// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CopilotMessageContent, ChatMessageData } from '../components/ai/CopilotMessageContent';

describe('CopilotMessageContent Structuring & Visual Results', () => {
  it('renders learning trajectory markdown into structured headings and visual progress cards', () => {
    const message: ChatMessageData = {
      id: 'msg-1',
      sender: 'assistant',
      text: `### Learning Trajectory for Ada Lovelace:

- **Full-Stack System Design & Distributed Architecture**: 44.4% completed (In Progress)
- **Advanced React & Modern TypeScript Patterns**: 50.0% completed (In Progress)
- **Cloud-Native Infrastructure & Container Security**: 0.0% completed (In Progress)`,
      timestamp: '02:30 PM'
    };

    render(<CopilotMessageContent message={message} />);

    // 1. Heading is rendered properly without raw ### markdown syntax
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Learning Trajectory for Ada Lovelace:');

    // 2. Course items are transformed into visual cards with titles
    expect(screen.getByText('Full-Stack System Design & Distributed Architecture')).toBeInTheDocument();
    expect(screen.getByText('Advanced React & Modern TypeScript Patterns')).toBeInTheDocument();
    expect(screen.getByText('Cloud-Native Infrastructure & Container Security')).toBeInTheDocument();

    // 3. Status badges and percentage numbers are visually rendered
    expect(screen.getByText('44.4%')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
    expect(screen.getByText('0.0%')).toBeInTheDocument();
    expect(screen.getAllByText('In Progress').length).toBe(3);
  });

  it('renders verifiable certificate achievement cards and navigation action pills', () => {
    const onNavigate = vi.fn();
    const message: ChatMessageData = {
      id: 'msg-2',
      sender: 'assistant',
      text: `Congratulations! You have earned **2** verifiable certificate(s).`,
      suggested_actions: [
        { label: 'My Learning Dashboard', path: '/my-learning' },
        { label: 'My Certificates', path: '/my-certificates' }
      ],
      timestamp: '02:31 PM'
    };

    render(<CopilotMessageContent message={message} onNavigateAction={onNavigate} />);

    // Credential card is rendered
    expect(screen.getByText(/2 Verifiable Credentials Earned/i)).toBeInTheDocument();

    // Action pills are clickable
    const dashboardBtn = screen.getByRole('button', { name: /My Learning Dashboard/i });
    expect(dashboardBtn).toBeInTheDocument();
    fireEvent.click(dashboardBtn);
    expect(onNavigate).toHaveBeenCalledWith('/my-learning');

    const certsBtn = screen.getByRole('button', { name: /My Certificates/i });
    expect(certsBtn).toBeInTheDocument();
    fireEvent.click(certsBtn);
    expect(onNavigate).toHaveBeenCalledWith('/my-certificates');
  });

  it('renders user messages plainly without markdown mutation', () => {
    const userMessage: ChatMessageData = {
      id: 'usr-1',
      sender: 'user',
      text: 'How do I view my current course progress?',
      timestamp: '02:30 PM'
    };

    render(<CopilotMessageContent message={userMessage} />);
    expect(screen.getByText('How do I view my current course progress?')).toBeInTheDocument();
  });
});

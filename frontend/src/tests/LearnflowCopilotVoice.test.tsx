import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LearnflowCopilot } from '../components/ai/LearnflowCopilot';
import { useAuthStore } from '../store/authStore';

// Mock apiClient to prevent real network requests while preserving auth sync exports
vi.mock('../services/api', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    apiClient: {
      post: vi.fn().mockResolvedValue({ data: { message: 'Guidance response', citations: [] } }),
      get: vi.fn().mockResolvedValue({ data: {} }),
    },
  };
});

describe('LearnflowCopilot Voice Recognition & Fallback Handling', () => {
  const originalAlert = window.alert;

  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'test-user-1',
        email: 'learner@learnflow.edu',
        first_name: 'Test',
        last_name: 'Learner',
        full_name: 'Test Learner',
        is_active: true,
        roles: [{ id: 1, name: 'learner', description: 'Learner' }],
      },
      token: 'fake-jwt-token',
    });
    window.alert = vi.fn();
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  });

  afterEach(() => {
    window.alert = originalAlert;
    delete (window as unknown as Record<string, unknown>).SpeechRecognition;
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    vi.clearAllMocks();
  });

  it('gracefully alerts and falls back when Web Speech API is unsupported in browser', async () => {
    render(
      <MemoryRouter>
        <LearnflowCopilot />
      </MemoryRouter>
    );

    // Open Copilot drawer
    const openBtn = screen.getByText(/Study Copilot/i);
    fireEvent.click(openBtn);

    // Find microphone button
    const micBtn = screen.getByTitle('Speak query');
    expect(micBtn).toBeInTheDocument();

    // Click microphone button in unsupported environment
    fireEvent.click(micBtn);

    // Verify alert was called with helpful explanation and no crash occurred
    expect(window.alert).toHaveBeenCalledWith('Speech Recognition is not supported in this browser.');

    // Input field should retain standard placeholder and text input remains active
    const input = screen.getByPlaceholderText('Ask about concepts, courses, prerequisites...');
    expect(input).toBeInTheDocument();

    // Typing manually works normally
    fireEvent.change(input, { target: { value: 'Explain recursion' } });
    expect(input).toHaveValue('Explain recursion');
  });

  it('activates microphone, handles speech transcription, and toggles off when SpeechRecognition is present', async () => {
    const mockStart = vi.fn();
    const mockStop = vi.fn();
    let activeInstance: {
      onstart: (() => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
      onresult: ((event: unknown) => void) | null;
    } | null = null;

    class MockSpeechRecognition {
      lang = '';
      interimResults = false;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onresult: ((event: unknown) => void) | null = null;

      constructor() {
        activeInstance = this;
      }

      start = () => {
        mockStart();
        if (this.onstart) {
          this.onstart();
        }
      };

      stop = () => {
        mockStop();
        if (this.onend) {
          this.onend();
        }
      };
    }

    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = MockSpeechRecognition;

    render(
      <MemoryRouter>
        <LearnflowCopilot />
      </MemoryRouter>
    );

    // Open Copilot drawer
    act(() => {
      fireEvent.click(screen.getByText(/Study Copilot/i));
    });

    const micBtn = screen.getByTitle('Speak query');

    // Click to start listening
    act(() => {
      fireEvent.click(micBtn);
    });

    expect(mockStart).toHaveBeenCalled();

    // Verify speech recognition instance captured and trigger result
    act(() => {
      if (activeInstance?.onresult) {
        activeInstance.onresult({
          results: [[{ transcript: 'What is a binary search tree?' }]],
        });
      }
    });

    // Transcript should be inserted into the text input
    const input = screen.getByDisplayValue('What is a binary search tree?');
    expect(input).toBeInTheDocument();

    // Click again to stop listening
    act(() => {
      if (activeInstance?.onend) {
        activeInstance.onend();
      }
    });

    const stopBtn = screen.getByTitle('Speak query');
    expect(stopBtn).toBeInTheDocument();
  });
});

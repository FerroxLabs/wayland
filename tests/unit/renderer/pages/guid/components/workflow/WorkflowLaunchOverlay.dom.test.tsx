/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'en-US' },
  }),
}));

// Stub Arco Spin so we can assert the spinner is rendered on Frame 1.
vi.mock('@arco-design/web-react', () => ({
  Spin: () => <div data-testid='workflow-launch-spinner' />,
}));

import { WorkflowLaunchOverlay } from '@/renderer/pages/guid/components/workflow/WorkflowLaunchOverlay';

describe('WorkflowLaunchOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders Frame 1 ("Preparing workflow…") with a spinner immediately', () => {
    const onComplete = vi.fn();
    render(<WorkflowLaunchOverlay workflowName='Automate Business Workflows' totalSteps={6} onComplete={onComplete} />);

    expect(screen.getByText('Preparing workflow…')).toBeTruthy();
    expect(screen.getByTestId('workflow-launch-spinner')).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('advances to Frame 2 ("Body loaded" / "Parsing 6 steps") at 200ms', () => {
    const onComplete = vi.fn();
    render(<WorkflowLaunchOverlay workflowName='Automate Business Workflows' totalSteps={6} onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText(/Body loaded/i)).toBeTruthy();
    expect(screen.getByText(/Parsing 6 steps/i)).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('uses the supplied totalSteps in Frame 2 ("Parsing 4 steps")', () => {
    const onComplete = vi.fn();
    render(<WorkflowLaunchOverlay workflowName='Lead Gen' totalSteps={4} onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText(/Parsing 4 steps/i)).toBeTruthy();
  });

  it('advances to Frame 3 ("Steps detected" / "Composing directive") at 800ms', () => {
    const onComplete = vi.fn();
    render(<WorkflowLaunchOverlay workflowName='Automate Business Workflows' totalSteps={6} onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(screen.getByText(/Steps detected/i)).toBeTruthy();
    expect(screen.getByText(/Composing directive/i)).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('advances to Frame 4 ("Workflow active" / "Ready when you are →") at 1400ms', () => {
    const onComplete = vi.fn();
    render(<WorkflowLaunchOverlay workflowName='Automate Business Workflows' totalSteps={6} onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(1400);
    });

    expect(screen.getByText(/Workflow active/i)).toBeTruthy();
    expect(screen.getByText(/Ready when you are/i)).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('begins fade-out at 1600ms and fires onComplete after the fade transition', () => {
    const onComplete = vi.fn();
    const { container } = render(
      <WorkflowLaunchOverlay workflowName='Automate Business Workflows' totalSteps={6} onComplete={onComplete} />
    );

    // Reach the fade-out boundary (1400ms frame 4 + 200ms hold).
    act(() => {
      vi.advanceTimersByTime(1600);
    });

    // Fade-out class should now be applied to the overlay root.
    const overlay = container.querySelector('[data-testid="workflow-launch-overlay"]');
    expect(overlay).toBeTruthy();
    expect(overlay?.className).toMatch(/fadeOut/i);

    // onComplete must not fire until the fade transition has elapsed.
    expect(onComplete).not.toHaveBeenCalled();

    // Drain timers so the post-fade callback fires.
    act(() => {
      vi.runAllTimers();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('clears timers on unmount - advancing time afterwards never fires onComplete', () => {
    const onComplete = vi.fn();
    const { unmount } = render(
      <WorkflowLaunchOverlay workflowName='Automate Business Workflows' totalSteps={6} onComplete={onComplete} />
    );

    unmount();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });
});

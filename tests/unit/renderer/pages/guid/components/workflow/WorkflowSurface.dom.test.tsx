/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W3.J - DOM tests for WorkflowSurface. Covers the SPEC §5.8 composition
 * contract: launch overlay gate, header + rail + status bar layout, pending
 * AskCard rendering, status-driven swaps (complete → CompleteCard, errored
 * → root class), pause/end wiring, children slot preservation, and the
 * one-shot hidden begin send.
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AskRecord, StepState, WorkflowSession } from '@/common/types/workflowTypes';

// ---------------------------------------------------------------------------
// Mocks (declared before component import - Vitest hoists vi.mock).
// ---------------------------------------------------------------------------

const sendMessageMock = vi.fn().mockResolvedValue({ success: true });
const updateSessionStateMock = vi.fn().mockResolvedValue({ session: null });

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      sendMessage: { invoke: (...a: unknown[]) => sendMessageMock(...a) },
    },
    workflow: {
      updateSessionState: { invoke: (...a: unknown[]) => updateSessionStateMock(...a) },
    },
  },
}));

// Capture the props each leaf component was rendered with so behavioral
// assertions stay focused on the composer's wiring contract, not the leaf
// internals (which have their own coverage in sibling spec files).
type CapturedProps = Record<string, unknown>;
const headerCalls: CapturedProps[] = [];
const railCalls: CapturedProps[] = [];
const statusBarCalls: CapturedProps[] = [];
const completeCalls: CapturedProps[] = [];
const overlayCalls: CapturedProps[] = [];
const askCalls: CapturedProps[] = [];

vi.mock('@/renderer/pages/guid/components/workflow/WorkflowHeader', () => ({
  WorkflowHeader: (props: CapturedProps) => {
    headerCalls.push(props);
    const paused = Boolean(props.paused);
    return (
      <div data-testid='mock-workflow-header' data-paused={paused ? 'true' : 'false'}>
        <button onClick={props.onPauseToggle as () => void}>
          {paused ? 'Resume auto-advance' : 'Pause auto-advance'}
        </button>
        <button onClick={props.onEnd as () => void}>End workflow</button>
      </div>
    );
  },
  default: () => null,
}));

vi.mock('@/renderer/pages/guid/components/workflow/WorkflowStepRail', () => ({
  WorkflowStepRail: (props: React.PropsWithChildren<CapturedProps>) => {
    railCalls.push(props);
    return (
      <div data-testid='mock-workflow-rail'>
        <button onClick={() => (props.onJumpToStep as (n: number) => void)(4)}>jump-4</button>
        <button onClick={() => (props.onRunAutonomously as (n: number) => void)(2)}>run-2</button>
        <div>{props.children}</div>
      </div>
    );
  },
  default: () => null,
}));

vi.mock('@/renderer/pages/guid/components/workflow/WorkflowStatusBar', () => ({
  WorkflowStatusBar: (props: CapturedProps) => {
    statusBarCalls.push(props);
    return <div data-testid='mock-workflow-status-bar' />;
  },
  default: () => null,
}));

vi.mock('@/renderer/pages/guid/components/workflow/WorkflowCompleteCard', () => ({
  WorkflowCompleteCard: (props: CapturedProps) => {
    completeCalls.push(props);
    return (
      <div data-testid='mock-workflow-complete'>
        <button onClick={props.onRunAgain as () => void}>run-again</button>
        <button onClick={() => (props.onLaunchNext as (s: string) => void)('next-wf')}>launch-next</button>
      </div>
    );
  },
  default: () => null,
}));

vi.mock('@/renderer/pages/guid/components/workflow/WorkflowLaunchOverlay', () => ({
  WorkflowLaunchOverlay: (props: CapturedProps) => {
    overlayCalls.push(props);
    return (
      <div data-testid='mock-workflow-launch-overlay'>
        <button data-testid='mock-overlay-complete' onClick={props.onComplete as () => void}>
          finish-overlay
        </button>
      </div>
    );
  },
  default: () => null,
}));

vi.mock('@/renderer/pages/guid/components/workflow/AskCard', () => ({
  AskCard: (props: CapturedProps) => {
    askCalls.push(props);
    const ask = props.ask as AskRecord;
    return (
      <div data-testid='mock-ask-card' data-ask-id={ask.id}>
        <button onClick={() => (props.onSubmit as (a: string) => void)('answered-value')}>submit-{ask.id}</button>
        <button onClick={props.onSkip as () => void}>skip-{ask.id}</button>
      </div>
    );
  },
  default: () => null,
}));

// Arco Modal.confirm is a side-effecting imperative API; stub it so we can
// observe end-workflow confirmation without rendering a real dialog tree.
const modalConfirmMock = vi.fn();
vi.mock('@arco-design/web-react', () => ({
  Modal: { confirm: (...a: unknown[]) => modalConfirmMock(...a) },
}));

// useWorkflowSession is the hook under composition. Stub it with a
// fully-controllable test double so the composer's reactions to status,
// asks, and callbacks can be exercised in isolation.
type HookOverrides = {
  data?: WorkflowSession | null;
  jumpToStep?: ReturnType<typeof vi.fn>;
  runStepAutonomously?: ReturnType<typeof vi.fn>;
  answerAsk?: ReturnType<typeof vi.fn>;
  pause?: ReturnType<typeof vi.fn>;
  resume?: ReturnType<typeof vi.fn>;
  end?: ReturnType<typeof vi.fn>;
  markBeginSent?: ReturnType<typeof vi.fn>;
};

let hookOverrides: HookOverrides = {};

vi.mock('@/renderer/hooks/workflow/useWorkflowSession', () => ({
  useWorkflowSession: () => ({
    data: hookOverrides.data ?? null,
    loading: false,
    error: null,
    isActive: () => hookOverrides.data != null,
    jumpToStep: hookOverrides.jumpToStep ?? vi.fn().mockResolvedValue(undefined),
    runStepAutonomously: hookOverrides.runStepAutonomously ?? vi.fn().mockResolvedValue({ dispatchId: 'd' }),
    answerAsk: hookOverrides.answerAsk ?? vi.fn().mockResolvedValue(undefined),
    pause: hookOverrides.pause ?? vi.fn(),
    resume: hookOverrides.resume ?? vi.fn(),
    end: hookOverrides.end ?? vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
    applyStepMarker: vi.fn().mockResolvedValue(undefined),
    markBeginSent:
      hookOverrides.markBeginSent ??
      vi.fn().mockImplementation(async (at: number) => ({
        ...hookOverrides.data,
        begin_sent_at: at,
      })),
  }),
}));

// Component under test must be imported AFTER all mocks are registered.
import { WorkflowSurface } from '@/renderer/pages/guid/components/workflow/WorkflowSurface';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = 1_700_000_000_000;

const buildStep = (n: number, status: StepState['status'] = 'todo'): StepState => ({
  n,
  title: `Step ${n}`,
  body_excerpt: '',
  status,
  started_at: null,
  completed_at: null,
  eta_seconds: null,
  eta_source: null,
  autonomous_run: null,
});

const buildAsk = (id: string, answer: string | null = null): AskRecord => ({
  id,
  step_n: 1,
  question: `Question ${id}?`,
  type: 'text',
  options: null,
  max: null,
  placeholder: null,
  answer,
  asked_at: NOW,
  answered_at: answer ? NOW : null,
});

const buildSession = (overrides: Partial<WorkflowSession> = {}): WorkflowSession => ({
  id: 'sess-1',
  workflow_name: 'automate-business-workflows',
  workflow_title: 'Automate Business Workflows',
  conversation_id: 'conv-1',
  current_step: 1,
  total_steps: 4,
  steps: [buildStep(1), buildStep(2), buildStep(3), buildStep(4)],
  skills: [],
  asks: [],
  status: 'active',
  palette: null,
  category: null,
  created_at: NOW - 60_000,
  updated_at: NOW,
  completed_at: null,
  begin_sent_at: null,
  ...overrides,
});

// Render with the overlay already dismissed - clicks the mock overlay's
// "finish-overlay" button which fires onComplete synchronously.
const renderPostOverlay = (
  session: WorkflowSession,
  extraProps: Partial<React.ComponentProps<typeof WorkflowSurface>> = {}
): ReturnType<typeof render> => {
  hookOverrides.data = session;
  const utils = render(
    <WorkflowSurface sessionId='sess-1' initialSession={session} {...extraProps}>
      <div data-testid='caller-children'>chat-tape</div>
    </WorkflowSurface>
  );
  act(() => {
    fireEvent.click(screen.getByTestId('mock-overlay-complete'));
  });
  return utils;
};

beforeEach(() => {
  headerCalls.length = 0;
  railCalls.length = 0;
  statusBarCalls.length = 0;
  completeCalls.length = 0;
  overlayCalls.length = 0;
  askCalls.length = 0;
  hookOverrides = {};
  sendMessageMock.mockClear();
  updateSessionStateMock.mockClear();
  updateSessionStateMock.mockResolvedValue({ session: null });
  modalConfirmMock.mockReset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WorkflowSurface', () => {
  it('renders WorkflowLaunchOverlay on first mount and hides the rest', () => {
    hookOverrides.data = buildSession();
    render(
      <WorkflowSurface sessionId='sess-1' initialSession={hookOverrides.data}>
        <div data-testid='caller-children'>chat-tape</div>
      </WorkflowSurface>
    );

    expect(screen.getByTestId('mock-workflow-launch-overlay')).toBeTruthy();
    expect(screen.queryByTestId('mock-workflow-header')).toBeNull();
    expect(screen.queryByTestId('mock-workflow-rail')).toBeNull();
    expect(screen.queryByTestId('caller-children')).toBeNull();
    expect(overlayCalls[0].workflowName).toBe('Automate Business Workflows');
    expect(overlayCalls[0].totalSteps).toBe(4);
  });

  it('after overlay onComplete, renders header + rail + status bar + children slot', () => {
    renderPostOverlay(buildSession());

    expect(screen.getByTestId('mock-workflow-header')).toBeTruthy();
    expect(screen.getByTestId('mock-workflow-rail')).toBeTruthy();
    expect(screen.getByTestId('mock-workflow-status-bar')).toBeTruthy();
    expect(screen.getByTestId('caller-children')).toBeTruthy();
    // StatusBar must be wired as the rail's children (per SPEC §5.8).
    expect(railCalls.length).toBeGreaterThan(0);
  });

  it('renders WorkflowCompleteCard instead of the rail when status === "complete"', () => {
    const onRunAgain = vi.fn();
    const onLaunchNext = vi.fn();
    renderPostOverlay(buildSession({ status: 'complete', completed_at: NOW }), {
      onRunAgain,
      onLaunchNext,
      suggestedNext: [{ slug: 'next-wf', display: 'Next Workflow' }],
    });

    expect(screen.getByTestId('mock-workflow-complete')).toBeTruthy();
    expect(screen.queryByTestId('mock-workflow-rail')).toBeNull();

    fireEvent.click(screen.getByText('run-again'));
    expect(onRunAgain).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('launch-next'));
    expect(onLaunchNext).toHaveBeenCalledWith('next-wf');

    expect(completeCalls[0].suggestedNext).toEqual([{ slug: 'next-wf', display: 'Next Workflow' }]);
  });

  it('applies the errored class on the root when status === "errored"', () => {
    const { container } = renderPostOverlay(buildSession({ status: 'errored' }));

    const root = container.querySelector('[data-testid="workflow-surface"]');
    expect(root).toBeTruthy();
    expect(root?.className).toMatch(/errored/i);
  });

  it('renders one AskCard per pending ask (answer === null), and skips already-answered asks', () => {
    const pending1 = buildAsk('ask-1');
    const pending2 = buildAsk('ask-2');
    const answered = buildAsk('ask-3', 'old-answer');
    renderPostOverlay(buildSession({ asks: [pending1, answered, pending2] }));

    const cards = screen.getAllByTestId('mock-ask-card');
    expect(cards).toHaveLength(2);
    const ids = cards.map((c) => c.getAttribute('data-ask-id'));
    expect(ids).toEqual(expect.arrayContaining(['ask-1', 'ask-2']));
    expect(ids).not.toContain('ask-3');
  });

  it('AskCard onSubmit calls session.answerAsk + sends the answer as a chat message', async () => {
    const answerAsk = vi.fn().mockResolvedValue(undefined);
    hookOverrides.answerAsk = answerAsk;
    renderPostOverlay(buildSession({ asks: [buildAsk('ask-1')] }));

    await act(async () => {
      fireEvent.click(screen.getByText('submit-ask-1'));
    });

    expect(answerAsk).toHaveBeenCalledWith('ask-1', 'answered-value');
    expect(sendMessageMock).toHaveBeenCalled();
    const payload = sendMessageMock.mock.calls.at(-1)?.[0] as {
      conversation_id: string;
      input: string;
    };
    expect(payload.conversation_id).toBe('conv-1');
    expect(payload.input).toContain('answered-value');
  });

  it('AskCard onSubmit sends the workflow_answer envelope (NOT the raw answer) per SPEC §7', async () => {
    const answerAsk = vi.fn().mockResolvedValue(undefined);
    hookOverrides.answerAsk = answerAsk;
    // buildAsk defaults step_n to 1
    renderPostOverlay(buildSession({ asks: [buildAsk('ask-1')] }));

    await act(async () => {
      fireEvent.click(screen.getByText('submit-ask-1'));
    });

    expect(sendMessageMock).toHaveBeenCalled();
    const payload = sendMessageMock.mock.calls.at(-1)?.[0] as { input: string };
    // Must contain the structured envelope header with ask_id and step_n
    expect(payload.input).toContain('[workflow_answer ask_id="ask-1" step_n="1"]');
    // Must contain the <answer> block wrapping the user's answer
    expect(payload.input).toContain('<answer>answered-value</answer>');
    // Must close the envelope
    expect(payload.input).toContain('[/workflow_answer]');
    // Must NOT send the raw answer string alone
    expect(payload.input).not.toBe('answered-value');
  });

  it('cross-instance begin dedup: markBeginSent returning a different begin_sent_at skips sendMessage', async () => {
    const session = buildSession({ begin_sent_at: null });
    // Simulate another instance winning the race: return begin_sent_at = 999_999
    // which will never equal the `at = Date.now()` the component captures.
    const markBeginSent = vi.fn().mockResolvedValue({ ...session, begin_sent_at: 999_999 });
    hookOverrides.data = session;
    hookOverrides.markBeginSent = markBeginSent;
    render(
      <WorkflowSurface sessionId='sess-1' initialSession={session}>
        <div data-testid='caller-children'>chat-tape</div>
      </WorkflowSurface>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('mock-overlay-complete'));
    });

    // markBeginSent was called (we tried to claim the slot)
    expect(markBeginSent).toHaveBeenCalledTimes(1);
    // But sendMessage must NOT fire because we lost the race
    expect(sendMessageMock).not.toHaveBeenCalled();
  });

  it('pause button flips header label (paused state lives in the composer)', () => {
    const pause = vi.fn();
    hookOverrides.pause = pause;
    renderPostOverlay(buildSession());

    // First render: not paused.
    expect(headerCalls.at(-1)?.paused).toBe(false);

    act(() => {
      fireEvent.click(screen.getByText('Pause auto-advance'));
    });
    expect(pause).toHaveBeenCalledTimes(1);
    expect(headerCalls.at(-1)?.paused).toBe(true);
    expect(screen.getByText('Resume auto-advance')).toBeTruthy();
  });

  it('End workflow shows a confirm modal; confirming triggers session.end()', () => {
    const end = vi.fn().mockResolvedValue(undefined);
    hookOverrides.end = end;
    renderPostOverlay(buildSession());

    fireEvent.click(screen.getByText('End workflow'));
    expect(modalConfirmMock).toHaveBeenCalledTimes(1);

    const config = modalConfirmMock.mock.calls[0][0] as { onOk: () => void };
    expect(typeof config.onOk).toBe('function');
    act(() => {
      config.onOk();
    });
    expect(end).toHaveBeenCalledTimes(1);
  });

  it('wires rail callbacks: onJumpToStep → session.jumpToStep, onRunAutonomously → session.runStepAutonomously', () => {
    const jumpToStep = vi.fn().mockResolvedValue(undefined);
    const runStepAutonomously = vi.fn().mockResolvedValue({ dispatchId: 'd' });
    hookOverrides.jumpToStep = jumpToStep;
    hookOverrides.runStepAutonomously = runStepAutonomously;
    renderPostOverlay(buildSession());

    fireEvent.click(screen.getByText('jump-4'));
    expect(jumpToStep).toHaveBeenCalledWith(4);

    fireEvent.click(screen.getByText('run-2'));
    expect(runStepAutonomously).toHaveBeenCalledWith(2);
  });

  it('fresh launch (begin_sent_at null, all steps todo): calls markBeginSent then sendMessage', async () => {
    const session = buildSession({ begin_sent_at: null });
    // Return begin_sent_at matching the `at` arg so the at-comparison dedup passes.
    const markBeginSent = vi.fn().mockImplementation(async (at: number) => ({ ...session, begin_sent_at: at }));
    hookOverrides.data = session;
    hookOverrides.markBeginSent = markBeginSent;
    render(
      <WorkflowSurface sessionId='sess-1' initialSession={session}>
        <div data-testid='caller-children'>chat-tape</div>
      </WorkflowSurface>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('mock-overlay-complete'));
    });

    // The hook's markBeginSent wraps the IPC + updates local data synchronously.
    // Routing through the hook (not raw ipcBridge) is what closes the
    // Strict-Mode begin-guard race that Audit A flagged.
    expect(markBeginSent).toHaveBeenCalledTimes(1);
    expect(typeof markBeginSent.mock.calls[0][0]).toBe('number');

    // sendMessage fires as the .then() continuation of markBeginSent.
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    const msgPayload = sendMessageMock.mock.calls[0][0] as {
      conversation_id: string;
      input: string;
    };
    expect(msgPayload.conversation_id).toBe('conv-1');
    expect(msgPayload.input).toContain('automate-business-workflows');
  });

  it('session with begin_sent_at already set: neither markBeginSent nor sendMessage fires on mount', async () => {
    const session = buildSession({ begin_sent_at: NOW - 1000 });
    const markBeginSent = vi.fn();
    hookOverrides.data = session;
    hookOverrides.markBeginSent = markBeginSent;
    render(
      <WorkflowSurface sessionId='sess-1' initialSession={session}>
        <div data-testid='caller-children'>chat-tape</div>
      </WorkflowSurface>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('mock-overlay-complete'));
    });

    expect(markBeginSent).not.toHaveBeenCalled();
    expect(sendMessageMock).not.toHaveBeenCalled();
  });

  it('mid-flight resume (begin_sent_at null, some steps not todo): calls markBeginSent but NOT sendMessage', async () => {
    const session = buildSession({
      begin_sent_at: null,
      steps: [buildStep(1, 'done'), buildStep(2, 'now'), buildStep(3), buildStep(4)],
    });
    const markBeginSent = vi.fn().mockResolvedValue({ ...session, begin_sent_at: NOW });
    hookOverrides.data = session;
    hookOverrides.markBeginSent = markBeginSent;
    render(
      <WorkflowSurface sessionId='sess-1' initialSession={session}>
        <div data-testid='caller-children'>chat-tape</div>
      </WorkflowSurface>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('mock-overlay-complete'));
    });

    // markBeginSent fires to mark the session so future mounts skip.
    expect(markBeginSent).toHaveBeenCalledTimes(1);
    expect(typeof markBeginSent.mock.calls[0][0]).toBe('number');

    // sendMessage must NOT fire for a mid-flight resume.
    expect(sendMessageMock).not.toHaveBeenCalled();
  });
});

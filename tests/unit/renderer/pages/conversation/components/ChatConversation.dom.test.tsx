/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wave 3 unit tests for ChatConversation workflow detection.
 *
 * Verifies that:
 * - Plain conversations render ChatLayout with normal header and no WorkflowSurface.
 * - Conversations with workflowSessionId render WorkflowSurface wrapping the platform
 *   chat node and pass hideHeader=true to ChatLayout.
 * - workflowSessionId from location.state takes precedence over conversation.extra.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks - all must be declared before the component import.
// ---------------------------------------------------------------------------

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      get: { invoke: vi.fn().mockResolvedValue(null) },
      getAssociateConversation: { invoke: vi.fn().mockResolvedValue([]) },
      createWithConversation: { invoke: vi.fn().mockResolvedValue(null) },
      update: { invoke: vi.fn().mockResolvedValue(null) },
      stop: { invoke: vi.fn().mockResolvedValue(null) },
    },
    fs: { listBuiltinAutoSkills: { invoke: vi.fn().mockResolvedValue([]) } },
    workflow: {
      findAllActive: { invoke: vi.fn().mockResolvedValue({ sessions: [] }) },
    },
  },
}));

vi.mock('@/common/utils', () => ({ uuid: () => 'test-uuid' }));

// Capture ChatLayout props so we can assert on hideHeader.
type ChatLayoutCaptured = Record<string, unknown>;
const chatLayoutCalls: ChatLayoutCaptured[] = [];

vi.mock('@/renderer/pages/conversation/components/ChatLayout', () => ({
  default: (props: React.PropsWithChildren<ChatLayoutCaptured>) => {
    chatLayoutCalls.push({ ...props, children: undefined });
    return (
      <div data-testid='mock-chat-layout' data-hide-header={String(props.hideHeader ?? false)}>
        {props.children}
      </div>
    );
  },
}));

vi.mock('@/renderer/pages/conversation/components/ChatSider', () => ({
  default: () => <div data-testid='mock-chat-sider' />,
}));

// Platform chat mocks - each renders a distinctive testid and captures props
// so W0.3 can assert that `workflowTotalSteps` is forwarded from the hoisted
// `useWorkflowSession` call in ChatConversation.
type PlatformChatCaptured = Record<string, unknown>;
const acpChatCalls: PlatformChatCaptured[] = [];
const wcoreChatCalls: PlatformChatCaptured[] = [];
const geminiChatCalls: PlatformChatCaptured[] = [];

vi.mock('@/renderer/pages/conversation/platforms/acp/AcpChat', () => ({
  default: (props: PlatformChatCaptured) => {
    acpChatCalls.push(props);
    return <div data-testid='mock-acp-chat' />;
  },
}));
vi.mock('@/renderer/pages/conversation/platforms/wcore/WCoreChat', () => ({
  default: (props: PlatformChatCaptured) => {
    wcoreChatCalls.push(props);
    return <div data-testid='mock-wcore-chat' />;
  },
}));
vi.mock('@/renderer/pages/conversation/platforms/gemini/GeminiChat', () => ({
  default: (props: PlatformChatCaptured) => {
    geminiChatCalls.push(props);
    return <div data-testid='mock-gemini-chat' />;
  },
}));
vi.mock('@/renderer/pages/conversation/platforms/nanobot/NanobotChat', () => ({
  default: () => <div data-testid='mock-nanobot-chat' />,
}));
vi.mock('@/renderer/pages/conversation/platforms/openclaw/OpenClawChat', () => ({
  default: () => <div data-testid='mock-openclaw-chat' />,
}));
vi.mock('@/renderer/pages/conversation/platforms/remote/RemoteChat', () => ({
  default: () => <div data-testid='mock-remote-chat' />,
}));

// WorkflowSurface captures its sessionId and renders children.
type WorkflowSurfaceCaptured = Record<string, unknown>;
const workflowSurfaceCalls: WorkflowSurfaceCaptured[] = [];

vi.mock('@/renderer/pages/guid/components/workflow/WorkflowSurface', () => ({
  WorkflowSurface: (props: React.PropsWithChildren<WorkflowSurfaceCaptured>) => {
    workflowSurfaceCalls.push({ ...props, children: undefined });
    return (
      <div data-testid='mock-workflow-surface' data-session-id={String(props.sessionId)}>
        {props.children}
      </div>
    );
  },
}));

// Model selector stubs.
vi.mock('@/renderer/components/agent/AcpModelSelector', () => ({
  default: () => <div data-testid='mock-acp-model-selector' />,
}));
vi.mock('@/renderer/pages/conversation/platforms/gemini/GeminiModelSelector', () => ({
  default: () => <div data-testid='mock-gemini-model-selector' />,
}));
vi.mock('@/renderer/pages/conversation/platforms/wcore/WCoreModelSelector', () => ({
  default: () => <div data-testid='mock-wcore-model-selector' />,
}));

// Heavy dependency stubs.
vi.mock('@/renderer/pages/cron', () => ({ CronJobManager: () => null }));
vi.mock('@/renderer/pages/conversation/components/ConversationSkillsIndicator', () => ({
  default: () => null,
}));
vi.mock('@/renderer/pages/conversation/platforms/openclaw/StarOfficeMonitorCard.tsx', () => ({
  default: () => null,
}));
vi.mock('@/renderer/pages/conversation/Preview', () => ({
  usePreviewContext: () => ({ openPreview: vi.fn(), isOpen: false }),
}));
vi.mock('@/renderer/hooks/agent/usePresetAssistantInfo', () => ({
  usePresetAssistantInfo: () => ({ info: null, isLoading: false }),
  resolveAssistantConfigId: () => null,
}));

// W0.3: hoisted workflow-session subscription lives in ChatConversation.
// Mocked so we can assert `workflowTotalSteps` is forwarded to the platform
// chat without touching the IPC bridge.
let mockWorkflowSessionData: { total_steps: number } | null = null;
vi.mock('@/renderer/hooks/workflow/useWorkflowSession', () => ({
  useWorkflowSession: () => ({
    data: mockWorkflowSessionData,
    loading: false,
    error: null,
    isActive: () => true,
    jumpToStep: vi.fn(),
    runStepAutonomously: vi.fn(),
    answerAsk: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    end: vi.fn(),
    refresh: vi.fn(),
    applyStepMarker: vi.fn(),
    markBeginSent: vi.fn(),
  }),
}));
// Provider list is mutable so #132 can seed a provider that offers the
// workflow's persisted model (the #124 validation effect drops a currentModel
// whose model no provider offers). Existing tests keep the empty default.
let mockProviders: Array<Record<string, unknown>> = [];
let mockAvailableModels: (p: Record<string, unknown>) => string[] = () => [];
vi.mock('@/renderer/hooks/agent/useModelProviderList', () => ({
  useModelProviderList: () => ({
    providers: mockProviders,
    connectedProviders: mockProviders,
    isLoading: false,
    geminiModeLookup: new Map(),
    getAvailableModels: (p: Record<string, unknown>) => mockAvailableModels(p),
    formatModelLabel: () => '',
  }),
}));
vi.mock('@/renderer/styles/colors', () => ({ iconColors: { primary: '#000' } }));

// useLocation / useNavigate - default to empty state.
let mockLocationState: Record<string, unknown> | null = null;
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ state: mockLocationState, key: 'test', pathname: '/', search: '', hash: '' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('swr', () => ({
  default: (_key: unknown, fetcher: (() => unknown) | null) => {
    if (!fetcher) return { data: undefined };
    return { data: undefined };
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock('../../../utils/emitter', () => ({ emitter: { emit: vi.fn() } }), { spy: false });
vi.mock('@/renderer/utils/emitter', () => ({ emitter: { emit: vi.fn() } }), { spy: false });

// Component under test - imported after all mocks.
import ChatConversation from '@/renderer/pages/conversation/components/ChatConversation';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

type AcpExtra = {
  backend: string;
  workspace?: string;
  workflowSessionId?: string;
  [k: string]: unknown;
};

const buildAcpConversation = (extra: Partial<AcpExtra> = {}) =>
  ({
    id: 'conv-1',
    name: 'Test Chat',
    type: 'acp',
    extra: { backend: 'claude', ...extra },
    createTime: 0,
    modifyTime: 0,
  }) as unknown as Parameters<typeof ChatConversation>[0]['conversation'];

const buildWCoreConversation = (extra: Record<string, unknown> = {}) =>
  ({
    id: 'conv-wcore',
    name: 'WCore Chat',
    type: 'wcore',
    extra: { workspace: '/tmp', ...extra },
    model: {},
    createTime: 0,
    modifyTime: 0,
  }) as unknown as Parameters<typeof ChatConversation>[0]['conversation'];

const buildGeminiConversation = (extra: Record<string, unknown> = {}) =>
  ({
    id: 'conv-gemini',
    name: 'Gemini Chat',
    type: 'gemini',
    extra: { workspace: '/tmp', ...extra },
    model: {},
    createTime: 0,
    modifyTime: 0,
  }) as unknown as Parameters<typeof ChatConversation>[0]['conversation'];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  chatLayoutCalls.length = 0;
  workflowSurfaceCalls.length = 0;
  acpChatCalls.length = 0;
  wcoreChatCalls.length = 0;
  geminiChatCalls.length = 0;
  mockLocationState = null;
  mockWorkflowSessionData = null;
  mockProviders = [];
  mockAvailableModels = () => [];
});

describe('ChatConversation - non-workflow path', () => {
  it('ACP conversation without workflowSessionId renders AcpChat inside ChatLayout without WorkflowSurface', () => {
    render(<ChatConversation conversation={buildAcpConversation()} />);

    expect(screen.getByTestId('mock-acp-chat')).toBeTruthy();
    expect(screen.getByTestId('mock-chat-layout')).toBeTruthy();
    expect(screen.queryByTestId('mock-workflow-surface')).toBeNull();
    // header is visible (hideHeader is falsy)
    const layout = screen.getByTestId('mock-chat-layout');
    expect(layout.getAttribute('data-hide-header')).toBe('false');
  });
});

describe('ChatConversation - workflow path via conversation.extra', () => {
  it('ACP conversation with extra.workflowSessionId renders WorkflowSurface wrapping AcpChat with hideHeader=true', () => {
    render(<ChatConversation conversation={buildAcpConversation({ workflowSessionId: 'sess-abc' })} />);

    const surface = screen.getByTestId('mock-workflow-surface');
    expect(surface).toBeTruthy();
    expect(surface.getAttribute('data-session-id')).toBe('sess-abc');

    expect(workflowSurfaceCalls[0]?.sessionId).toBe('sess-abc');

    // AcpChat must be a descendant of WorkflowSurface.
    expect(screen.getByTestId('mock-acp-chat')).toBeTruthy();

    // ChatLayout must have hideHeader=true.
    const layout = screen.getByTestId('mock-chat-layout');
    expect(layout.getAttribute('data-hide-header')).toBe('true');
  });

  it('WCore conversation with extra.workflowSessionId renders WorkflowSurface wrapping WCoreChat', () => {
    render(<ChatConversation conversation={buildWCoreConversation({ workflowSessionId: 'sess-wcore' })} />);

    const surface = screen.getByTestId('mock-workflow-surface');
    expect(surface).toBeTruthy();
    expect(surface.getAttribute('data-session-id')).toBe('sess-wcore');
    expect(screen.getByTestId('mock-wcore-chat')).toBeTruthy();

    const layout = screen.getByTestId('mock-chat-layout');
    expect(layout.getAttribute('data-hide-header')).toBe('true');
  });

  it('Gemini conversation with extra.workflowSessionId renders WorkflowSurface wrapping GeminiChat', () => {
    render(<ChatConversation conversation={buildGeminiConversation({ workflowSessionId: 'sess-gemini' })} />);

    const surface = screen.getByTestId('mock-workflow-surface');
    expect(surface).toBeTruthy();
    expect(surface.getAttribute('data-session-id')).toBe('sess-gemini');
    expect(screen.getByTestId('mock-gemini-chat')).toBeTruthy();

    const layout = screen.getByTestId('mock-chat-layout');
    expect(layout.getAttribute('data-hide-header')).toBe('true');
  });
});

describe('ChatConversation - workflow composer model selection (#132)', () => {
  it('seeds WCore workflow chat with a real model selection from conversation.model (not a null-object)', () => {
    // #132: the workflow path passed a static null-object model selection
    // (currentModel: undefined), so typing in the composer inside a running
    // workflow threw "No model selected for current session". The send box
    // gate requires currentModel?.useModel; it must come from conversation.model.
    mockProviders = [{ id: 'wcore-prov', platform: 'wayland-core' }];
    mockAvailableModels = () => ['sonnet-4.6'];

    const conv = buildWCoreConversation({ workflowSessionId: 'sess-model' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (conv as any).model = { id: 'wcore-prov', useModel: 'sonnet-4.6' };

    render(<ChatConversation conversation={conv} />);

    const selection = wcoreChatCalls.at(-1)?.modelSelection as { currentModel?: { useModel?: string } } | undefined;
    expect(selection?.currentModel?.useModel).toBe('sonnet-4.6');
  });

  it('seeds Gemini workflow chat with a real model selection from conversation.model', () => {
    mockProviders = [{ id: 'gem-prov', platform: 'gemini' }];
    mockAvailableModels = () => ['gemini-3.5'];

    const conv = buildGeminiConversation({ workflowSessionId: 'sess-gem-model' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (conv as any).model = { id: 'gem-prov', useModel: 'gemini-3.5' };

    render(<ChatConversation conversation={conv} />);

    const selection = geminiChatCalls.at(-1)?.modelSelection as { currentModel?: { useModel?: string } } | undefined;
    expect(selection?.currentModel?.useModel).toBe('gemini-3.5');
  });
});

describe('ChatConversation - workflowSessionId from location.state', () => {
  it('state.workflowSessionId takes precedence when both state and extra are present', () => {
    // State says 'state-sess', extra says 'extra-sess' - state wins.
    mockLocationState = { workflowSessionId: 'state-sess' };
    render(<ChatConversation conversation={buildAcpConversation({ workflowSessionId: 'extra-sess' })} />);

    const surface = screen.getByTestId('mock-workflow-surface');
    expect(surface.getAttribute('data-session-id')).toBe('state-sess');
    expect(workflowSurfaceCalls[0]?.sessionId).toBe('state-sess');
  });

  it('falls back to conversation.extra.workflowSessionId when location.state has none', () => {
    mockLocationState = {};
    render(<ChatConversation conversation={buildAcpConversation({ workflowSessionId: 'extra-fallback' })} />);

    const surface = screen.getByTestId('mock-workflow-surface');
    expect(surface.getAttribute('data-session-id')).toBe('extra-fallback');
  });

  it('passes initialWorkflowSession from location.state to WorkflowSurface', () => {
    const initialSession = { id: 'sess-xyz', conversation_id: 'conv-1', status: 'active' };
    mockLocationState = { workflowSessionId: 'sess-xyz', initialWorkflowSession: initialSession };
    render(<ChatConversation conversation={buildAcpConversation()} />);

    expect(workflowSurfaceCalls[0]?.initialSession).toEqual(initialSession);
  });
});

describe('ChatConversation - W0.3 hoisted workflow total_steps', () => {
  it('threads workflowTotalSteps from the hoisted useWorkflowSession into AcpChat', () => {
    mockWorkflowSessionData = { total_steps: 7 };
    render(<ChatConversation conversation={buildAcpConversation({ workflowSessionId: 'sess-totals' })} />);

    expect(acpChatCalls.length).toBeGreaterThan(0);
    expect(acpChatCalls[0]?.workflowSessionId).toBe('sess-totals');
    expect(acpChatCalls[0]?.workflowTotalSteps).toBe(7);
  });

  it('passes workflowTotalSteps=null when the workflow session data has not resolved', () => {
    mockWorkflowSessionData = null;
    render(<ChatConversation conversation={buildAcpConversation({ workflowSessionId: 'sess-loading' })} />);

    expect(acpChatCalls[0]?.workflowSessionId).toBe('sess-loading');
    expect(acpChatCalls[0]?.workflowTotalSteps).toBeNull();
  });

  it('forwards workflowApplyStepMarker from the hoisted session into AcpChat', () => {
    mockWorkflowSessionData = { total_steps: 3 };
    render(<ChatConversation conversation={buildAcpConversation({ workflowSessionId: 'sess-marker' })} />);

    // The hoisted hook's applyStepMarker callback is forwarded as a sibling
    // prop so per-message WorkflowMessageBody can call it through context
    // without each mounting its own useWorkflowSession (the N+1 fix).
    expect(typeof acpChatCalls[0]?.workflowApplyStepMarker).toBe('function');
  });
});

/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * The composer carries TWO voice affordances that look almost identical and
 * mean completely different things.
 *
 * Dictation is a microphone that writes words into the draft and stops. A voice
 * CONVERSATION opens a session that transcribes, sends the turn by itself, and
 * answers out loud. They sit next to each other in the same button row, they
 * both start with getUserMedia, and they both end in `transcribeAudioBlob`. The
 * only thing keeping them apart is which callback the transcript is handed to -
 * which is exactly the kind of wire that gets crossed silently.
 *
 * So this file drives the REAL composer, the REAL session, the REAL speech hook
 * and the REAL turn bridge, and asserts the separation from the outside: what
 * spoke, what got sent, what landed in the textarea. Only the edges are mocked -
 * the IPC surface, stored config, the media APIs jsdom does not have, and the
 * per-platform message hooks that would otherwise open real streams.
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IResponseMessage } from '@/common/adapter/ipcBridge';

// ── Test-controlled edges ────────────────────────────────────────────────────

const mockSpeak = vi.fn(async (_params: { text: string }) => ({
  ok: true as const,
  data: [82, 73, 70, 70],
  mimeType: 'audio/wav',
}));
const mockTranscribeAudioBlob = vi.fn(async () => ({ text: 'the transcript' }));

const responseListeners: Array<(message: IResponseMessage) => void> = [];

const sendInvokes = {
  wcore: vi.fn(async () => ({ success: true })),
  acp: vi.fn(async () => ({ success: true })),
  gemini: vi.fn(async () => ({ success: true })),
  openclaw: vi.fn(async () => ({ success: true })),
};

const mockClearFilesSpy = vi.fn();
const mockConversationGet = vi.fn(async () => ({ status: 'idle', extra: { workspace: '/workspace' } }));

/** Every microphone track handed out, so a test can prove the media was stopped. */
const openedTracks: Array<{ stop: ReturnType<typeof vi.fn> }> = [];

// ── Module mocks ─────────────────────────────────────────────────────────────

/*
 * `@/common` re-exports this module wholesale (`export * as ipcBridge from
 * './adapter/ipcBridge'`), so mocking the adapter alone covers BOTH the
 * session's imports and the platform wrappers' `ipcBridge.*` calls. Mocking the
 * two separately would hand the two halves of one turn two different fakes.
 */
vi.mock('@/common/adapter/ipcBridge', () => ({
  conversation: {
    get: { invoke: (...args: unknown[]) => mockConversationGet(...(args as [])) },
    stop: { invoke: vi.fn(async () => ({ success: true })) },
    warmup: { invoke: vi.fn(async () => undefined) },
    sendMessage: { invoke: (...args: unknown[]) => sendInvokes.wcore(...(args as [])) },
    responseStream: {
      on: (listener: (message: IResponseMessage) => void) => {
        responseListeners.push(listener);
        return () => {
          const index = responseListeners.indexOf(listener);
          if (index >= 0) responseListeners.splice(index, 1);
        };
      },
    },
    turnCompleted: { on: () => () => {} },
    confirmation: { add: { on: () => () => {} } },
    deleteMessagesAfter: { invoke: vi.fn(async () => ({ success: true })) },
  },
  acpConversation: { sendMessage: { invoke: (...args: unknown[]) => sendInvokes.acp(...(args as [])) } },
  geminiConversation: { sendMessage: { invoke: (...args: unknown[]) => sendInvokes.gemini(...(args as [])) } },
  openclawConversation: {
    sendMessage: { invoke: (...args: unknown[]) => sendInvokes.openclaw(...(args as [])) },
    // OpenClaw refuses to dispatch until the runtime matches what was expected,
    // so a bare `{success:false}` would make its send look deferred when it was
    // only blocked - and the V16 control would pass for the wrong reason.
    getRuntime: {
      invoke: vi.fn(async () => ({
        success: true,
        data: {
          runtime: {
            workspace: '/workspace',
            backend: 'openclaw',
            agentName: 'OpenClaw',
            cliPath: '/cli/openclaw',
            model: 'model-a',
            identityHash: 'identity-1',
            hasActiveSession: true,
          },
          expected: {
            expectedWorkspace: '/workspace',
            expectedBackend: 'openclaw',
            expectedAgentName: 'OpenClaw',
            expectedCliPath: '/cli/openclaw',
            expectedModel: 'model-a',
            expectedIdentityHash: 'identity-1',
          },
        },
      })),
    },
    responseStream: { on: () => () => {} },
  },
  remoteAgent: { get: { invoke: vi.fn(async () => null) } },
  database: { getConversationMessages: { invoke: vi.fn(async () => []) } },
  team: {
    sendMessage: { invoke: vi.fn(async () => ({ success: true })) },
    sendMessageToAgent: { invoke: vi.fn(async () => ({ success: true })) },
  },
  modelRegistry: { list: { invoke: vi.fn(async () => []) } },
  mic: { requestAccess: { invoke: vi.fn(async () => 'granted') } },
  voiceSynth: { speak: { invoke: (...args: unknown[]) => mockSpeak(...(args as [{ text: string }])) } },
}));

// Both legs local, both enabled: no disclosure is reachable and nothing in this
// file can talk to a real service.
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn(async (key: string) => {
      if (key === 'tools.speechToText') return { enabled: true, provider: 'whisper-local' };
      if (key === 'tools.textToSpeech')
        return { enabled: true, provider: 'system-native', voice: 'default', speed: 1, autoReadResponses: false };
      return undefined;
    }),
    set: vi.fn(async () => undefined),
  },
}));

vi.mock('@/renderer/services/SpeechToTextService', () => ({
  transcribeAudioBlob: (...args: unknown[]) => mockTranscribeAudioBlob(...(args as [])),
}));

vi.mock('@/renderer/utils/platform', () => ({
  isElectronDesktop: () => true,
  // Only macOS ships a local synthesizer, and the readiness check refuses
  // outright anywhere else.
  isMacOS: () => true,
}));

/*
 * The real file hooks, with `clearFiles` wrapped so the V16 assertion can be
 * made on the call itself rather than only on its consequences. Wrapping rather
 * than replacing keeps the real clearing behaviour on the control path, where a
 * turn genuinely should clear.
 */
vi.mock('@/renderer/hooks/chat/useSendBoxFiles', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/renderer/hooks/chat/useSendBoxFiles')>();
  return {
    ...actual,
    useSendBoxFiles: (args: Parameters<typeof actual.useSendBoxFiles>[0]) => {
      const real = actual.useSendBoxFiles(args);
      return {
        ...real,
        clearFiles: () => {
          mockClearFilesSpy();
          real.clearFiles();
        },
      };
    },
  };
});

// ── Platform plumbing the composer does not own ──────────────────────────────

vi.mock('@/renderer/pages/conversation/platforms/useConversationCommandQueue', () => ({
  shouldEnqueueConversationCommand: () => false,
  useConversationCommandQueue: () => ({
    items: [],
    isPaused: false,
    isInteractionLocked: false,
    hasPendingCommands: false,
    enqueue: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    reorder: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    lockInteraction: vi.fn(),
    unlockInteraction: vi.fn(),
    resetActiveExecution: vi.fn(),
  }),
}));

vi.mock('@/renderer/pages/conversation/platforms/assertBridgeSuccess', () => ({
  assertBridgeSuccess: vi.fn(),
}));

const platformMessageHook = () => ({
  thought: { subject: '', description: '' },
  running: false,
  hasHydratedRunningState: true,
  tokenUsage: 0,
  contextLimit: 0,
  acpStatus: null,
  aiProcessing: false,
  setAiProcessing: vi.fn(),
  setActiveMsgId: vi.fn(),
  setWaitingResponse: vi.fn(),
  resetState: vi.fn(),
  hasThinkingMessage: false,
});

vi.mock('@/renderer/pages/conversation/platforms/wcore/useWCoreMessage', () => ({
  useWCoreMessage: () => platformMessageHook(),
}));
vi.mock('@/renderer/pages/conversation/platforms/acp/useAcpMessage', () => ({
  useAcpMessage: () => platformMessageHook(),
}));
vi.mock('@/renderer/pages/conversation/platforms/acp/useAcpInitialMessage', () => ({
  useAcpInitialMessage: vi.fn(),
}));
vi.mock('@/renderer/pages/conversation/platforms/gemini/useGeminiMessage', () => ({
  useGeminiMessage: () => platformMessageHook(),
}));
vi.mock('@/renderer/pages/conversation/platforms/gemini/useGeminiInitialMessage', () => ({
  useGeminiInitialMessage: vi.fn(),
}));
vi.mock('@/renderer/pages/conversation/platforms/gemini/useGeminiQuotaFallback', () => ({
  useGeminiQuotaFallback: () => ({ handleGeminiError: vi.fn() }),
}));
vi.mock('@/renderer/hooks/agent/useAgentReadinessCheck', () => ({
  useAgentReadinessCheck: () => ({
    isChecking: false,
    error: null,
    availableAgents: [],
    bestAgent: null,
    progress: 0,
    currentAgent: null,
    performFullCheck: vi.fn(async () => undefined),
    reset: vi.fn(),
  }),
}));
vi.mock('@/renderer/hooks/useProviderReadiness', () => ({
  useProviderReadiness: () => ({ ready: true, loading: false }),
}));
vi.mock('@/renderer/hooks/chat/usePendingSendOnWake', () => ({
  usePendingSendOnWake: () => ({ holdIfAsleep: async () => false }),
}));
vi.mock('@/renderer/hooks/chat/useAutoTitle', () => ({
  useAutoTitle: () => ({ checkAndUpdateTitle: vi.fn(async () => undefined) }),
}));
vi.mock('@/renderer/hooks/chat/useSlashCommands', () => ({ useSlashCommands: () => [] }));
vi.mock('@/renderer/hooks/file/useOpenFileSelector', () => ({
  useOpenFileSelector: () => ({ openFileSelector: vi.fn(), onSlashBuiltinCommand: vi.fn() }),
}));
vi.mock('@/renderer/hooks/agent/useModelContextLimit', () => ({
  useModelContextLimit: () => () => 8192,
}));
vi.mock('@/renderer/pages/conversation/Messages/hooks', () => ({
  useAddOrUpdateMessage: () => vi.fn(),
  useRemoveMessageByMsgId: () => vi.fn(),
  useTruncateMessagesAfter: () => vi.fn(),
  useMessageList: () => [],
}));
vi.mock('@/renderer/pages/conversation/Preview', () => ({
  usePreviewContext: () => ({
    domSnippets: [],
    setSendBoxHandler: vi.fn(),
    removeDomSnippet: vi.fn(),
    clearDomSnippets: vi.fn(),
  }),
}));

// Heavy leaf components with nothing to say about voice. FilePreview keeps its
// path visible so "the attachment is still staged" is an assertion on the UI.
vi.mock('@/renderer/components/media/FilePreview', () => ({
  __esModule: true,
  default: ({ path }: { path?: string }) =>
    React.createElement('div', { 'data-testid': 'staged-file' }, String(path ?? '')),
}));
vi.mock('@/renderer/components/media/HorizontalFileList', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => React.createElement('div', {}, children),
}));
vi.mock('@/renderer/components/media/FileAttachButton', () => ({
  __esModule: true,
  default: () => React.createElement('div'),
}));
vi.mock('@/renderer/components/agent/AgentModeSelector', () => ({
  __esModule: true,
  default: () => React.createElement('div'),
}));
vi.mock('@/renderer/components/agent/AcpConfigSelector', () => ({
  __esModule: true,
  default: () => React.createElement('div'),
}));
vi.mock('@/renderer/components/agent/ContextUsageIndicator', () => ({
  __esModule: true,
  default: () => React.createElement('div'),
}));
vi.mock('@/renderer/components/agent/AgentSetupCard', () => ({
  __esModule: true,
  default: () => React.createElement('div'),
}));
vi.mock('@/renderer/components/chat/CommandQueuePanel', () => ({
  __esModule: true,
  default: () => React.createElement('div'),
}));
vi.mock('@/renderer/components/chat/ThoughtDisplay', () => ({
  __esModule: true,
  default: () => React.createElement('div'),
}));

// ── Composer edges ───────────────────────────────────────────────────────────

vi.mock('@/renderer/hooks/chat/useInputFocusRing', () => ({
  useInputFocusRing: () => ({
    activeBorderColor: '#111111',
    inactiveBorderColor: '#cccccc',
    activeShadow: '0 0 0 2px rgba(0,0,0,0.2)',
  }),
}));
vi.mock('@/renderer/hooks/context/LayoutContext', () => ({ useLayoutContext: () => ({ isMobile: false }) }));
vi.mock('@/renderer/hooks/chat/useCompositionInput', () => ({
  useCompositionInput: () => ({ compositionHandlers: {}, createKeyDownHandler: () => () => {} }),
}));
vi.mock('@renderer/hooks/file/useDragUpload', () => ({
  useDragUpload: () => ({ isFileDragging: false, dragHandlers: {} }),
}));
vi.mock('@renderer/hooks/file/usePasteService', () => ({
  usePasteService: () => ({ onPaste: vi.fn(), onFocus: vi.fn() }),
}));
vi.mock('@renderer/hooks/file/useUploadState', () => ({ useUploadState: () => ({ isUploading: false }) }));
vi.mock('@renderer/components/media/UploadProgressBar', () => ({ __esModule: true, default: () => null }));
vi.mock('@renderer/services/FileService', () => ({ allSupportedExts: ['.txt', '.png'] }));
vi.mock('@/renderer/services/FileService', () => ({
  allSupportedExts: ['.txt', '.png'],
  getCleanFileNames: (files: string[]) => files,
}));
vi.mock('@/renderer/hooks/chat/useSlashCommandController', () => ({
  useSlashCommandController: () => ({
    isOpen: false,
    filteredCommands: [],
    activeIndex: 0,
    setActiveIndex: vi.fn(),
    onSelectByIndex: vi.fn(),
    onKeyDown: vi.fn(),
  }),
}));
vi.mock('@/renderer/components/chat/SlashCommandMenu', () => ({ __esModule: true, default: () => null }));
vi.mock('@/renderer/utils/ui/focus', () => ({
  blurActiveElement: vi.fn(),
  shouldBlockMobileInputFocus: () => false,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
    i18n: { language: 'en-US' },
  }),
}));

vi.mock('@arco-design/web-react', () => ({
  Button: ({
    children,
    icon,
    ...rest
  }: Record<string, unknown> & { children?: React.ReactNode; icon?: React.ReactNode }) =>
    React.createElement(
      'button',
      {
        type: 'button',
        className: rest.className as string | undefined,
        disabled: rest.disabled as boolean | undefined,
        onClick: rest.onClick as (() => void) | undefined,
        'aria-label': rest['aria-label'] as string | undefined,
        title: rest.title as string | undefined,
      },
      (children as React.ReactNode) ?? icon
    ),
  Input: {
    TextArea: ({
      onChange,
      autoSize: _autoSize,
      ...props
    }: Record<string, unknown> & { onChange?: (value: string) => void }) =>
      React.createElement('textarea', {
        ...props,
        onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(event.target.value),
      }),
  },
  Modal: ({ children, visible }: { children?: React.ReactNode; visible?: boolean }) =>
    visible ? React.createElement('div', { role: 'dialog' }, children) : null,
  Tooltip: ({ children }: { children?: React.ReactNode }) => children ?? null,
  Message: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
    useMessage: () => [{ warning: vi.fn() }, null],
  },
  Tag: ({ children }: { children?: React.ReactNode }) => React.createElement('div', {}, children),
}));

// ── Real modules under test ──────────────────────────────────────────────────

import { ConversationProvider } from '@/renderer/hooks/context/ConversationContext';
import { VoiceSessionProvider, useVoiceSessionSafe } from '@/renderer/pages/conversation/voice/VoiceSessionContext';
import { __clearInMemoryDraftsForTests } from '@/renderer/hooks/chat/useSendBoxDraft';
import WCoreSendBox from '@/renderer/pages/conversation/platforms/wcore/WCoreSendBox';
import AcpSendBox from '@/renderer/pages/conversation/platforms/acp/AcpSendBox';
import GeminiSendBox from '@/renderer/pages/conversation/platforms/gemini/GeminiSendBox';
import NanobotSendBox from '@/renderer/pages/conversation/platforms/nanobot/NanobotSendBox';
import OpenClawSendBox from '@/renderer/pages/conversation/platforms/openclaw/OpenClawSendBox';
import RemoteSendBox from '@/renderer/pages/conversation/platforms/remote/RemoteSendBox';

// ── Media stand-ins jsdom does not provide ───────────────────────────────────

class MockAudio {
  src = '';
  private listeners = new Map<string, () => void>();
  addEventListener(type: string, listener: () => void) {
    this.listeners.set(type, listener);
  }
  fire(type: string) {
    this.listeners.get(type)?.();
  }
  pause() {}
  async play() {}
}

class MockMediaRecorder {
  static isTypeSupported(mimeType: string) {
    return mimeType === 'audio/webm';
  }
  public mimeType: string;
  public ondataavailable: ((event: { data: Blob }) => void) | null = null;
  public onerror: (() => void) | null = null;
  public onstop: (() => void) | null = null;
  public state = 'inactive';

  constructor(_stream: MediaStream, options?: { mimeType?: string }) {
    this.mimeType = options?.mimeType ?? 'audio/webm';
  }
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['recorded-audio'], { type: this.mimeType }) });
    this.onstop?.();
  }
}

const installMediaEnvironment = () => {
  openedTracks.splice(0);
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn(async () => {
        const track = { stop: vi.fn() };
        openedTracks.push(track);
        return {
          getTracks: () => [track],
          // Barge-in monitoring refuses any stream that cannot confirm echo
          // cancellation, so returning no audio track keeps it out of the way.
          getAudioTracks: () => [],
        } as unknown as MediaStream;
      }),
    },
  });
  vi.stubGlobal('MediaRecorder', MockMediaRecorder);
  vi.stubGlobal('Audio', MockAudio);
  // No AudioContext on purpose: the endpoint detector then has no signal to
  // read, so no background interval can fire a turn boundary mid-assertion.
  vi.stubGlobal('AudioContext', undefined);
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:voice') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
};

// ── Harness ──────────────────────────────────────────────────────────────────

/**
 * A window into the live session, and the only way to reach `finishCapture`
 * from a composer surface: the composer has no stop-speaking button while the
 * mic is open, because the endpoint detector normally closes the turn - and the
 * detector is exactly what cannot be driven deterministically here.
 */
const SessionProbe: React.FC = () => {
  const session = useVoiceSessionSafe();
  return (
    <>
      <span data-testid='session'>{`${session?.state ?? 'none'}|${session?.isActive ? 'live' : 'dead'}`}</span>
      <button type='button' data-testid='probe-finish' onClick={() => session?.finishCapture()}>
        finish
      </button>
    </>
  );
};

type PlatformKey = 'wcore' | 'acp' | 'gemini' | 'nanobot' | 'openclaw' | 'remote';

const DRAFT_TYPE: Record<PlatformKey, string> = {
  wcore: 'wcore',
  acp: 'acp',
  gemini: 'gemini',
  nanobot: 'nanobot',
  openclaw: 'openclaw-gateway',
  remote: 'remote',
};

const SEND_SPY: Record<PlatformKey, ReturnType<typeof vi.fn>> = {
  wcore: sendInvokes.wcore,
  acp: sendInvokes.acp,
  gemini: sendInvokes.gemini,
  nanobot: sendInvokes.wcore,
  openclaw: sendInvokes.openclaw,
  remote: sendInvokes.wcore,
};

const composerFor = (platform: PlatformKey, conversationId: string): React.ReactElement => {
  switch (platform) {
    case 'acp':
      return <AcpSendBox conversation_id={conversationId} backend='claude' />;
    case 'gemini':
      return (
        <GeminiSendBox
          conversation_id={conversationId}
          modelSelection={
            {
              currentModel: { useModel: 'gemini-2.5' },
              getDisplayModelName: (modelId: string) => modelId,
              providers: ['google'],
              geminiModeLookup: {},
              getAvailableModels: () => [],
              handleSelectModel: vi.fn(),
            } as unknown as React.ComponentProps<typeof GeminiSendBox>['modelSelection']
          }
        />
      );
    case 'nanobot':
      return <NanobotSendBox conversation_id={conversationId} />;
    case 'openclaw':
      return <OpenClawSendBox conversation_id={conversationId} />;
    case 'remote':
      return <RemoteSendBox conversation_id={conversationId} />;
    default:
      return (
        <WCoreSendBox
          conversation_id={conversationId}
          modelSelection={
            {
              currentModel: { useModel: 'wcore-1' },
              getDisplayModelName: (modelId: string) => modelId,
            } as unknown as React.ComponentProps<typeof WCoreSendBox>['modelSelection']
          }
        />
      );
  }
};

/** Pre-stage an attachment through the draft store's own durable mirror. */
const stageFile = (platform: PlatformKey, conversationId: string, filePath: string) => {
  localStorage.setItem(
    `wayland:sendbox-draft:${DRAFT_TYPE[platform]}:${conversationId}`,
    JSON.stringify({ _type: DRAFT_TYPE[platform], content: '', atPath: [], uploadFile: [filePath] })
  );
};

let conversationCounter = 0;

const renderComposer = (platform: PlatformKey = 'wcore', options: { stagedFile?: string } = {}) => {
  const conversationId = `conversation-${platform}-${++conversationCounter}`;
  if (options.stagedFile) stageFile(platform, conversationId, options.stagedFile);

  const view = render(
    <VoiceSessionProvider conversationId={conversationId} actorLabel='Wayland'>
      <ConversationProvider
        value={
          { conversationId, type: platform === 'openclaw' ? 'openclaw-gateway' : platform } as unknown as
            React.ComponentProps<typeof ConversationProvider>['value']
        }
      >
        {composerFor(platform, conversationId)}
        <SessionProbe />
      </ConversationProvider>
    </VoiceSessionProvider>
  );

  return { ...view, conversationId, send: SEND_SPY[platform] };
};

const textarea = (): HTMLTextAreaElement => screen.getByRole('textbox') as HTMLTextAreaElement;
const sessionState = (): string => screen.getByTestId('session').textContent ?? '';

/** Async: the button renders nothing until the stored speech config resolves. */
const dictationButton = () =>
  screen.findByRole('button', { name: 'conversation.chat.speech.recordTooltip' }) as Promise<HTMLButtonElement>;
const dictationStopButton = () => screen.findByRole('button', { name: 'conversation.chat.speech.stopTooltip' });
const talkButton = () => screen.getByRole('button', { name: 'Talk with Wayland' }) as HTMLButtonElement;

/** Dictation, exactly as a user does it: tap, talk, tap. */
const runDictation = async () => {
  const start = await dictationButton();
  await act(async () => {
    fireEvent.click(start);
  });
  const stop = await dictationStopButton();
  await act(async () => {
    fireEvent.click(stop);
  });
};

/** A spoken turn, from the composer's own entry button to the transcript. */
const speakOneTurn = async () => {
  await act(async () => {
    fireEvent.click(talkButton());
  });
  await act(async () => {
    fireEvent.click(screen.getByTestId('probe-finish'));
  });
};

/** The assistant answering, which is what makes the session speak out loud. */
const deliverAnswer = async (conversationId: string, text = 'Here is the answer.') => {
  await act(async () => {
    for (const listener of [...responseListeners]) {
      listener({ type: 'content', data: text, msg_id: 'assistant-1', conversation_id: conversationId } as IResponseMessage);
      listener({ type: 'finish', data: null, msg_id: 'assistant-1', conversation_id: conversationId } as IResponseMessage);
    }
  });
};

// ── Suite ────────────────────────────────────────────────────────────────────

describe('the two voice affordances are not the same feature', () => {
  const originalCanvasGetContext = HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    vi.clearAllMocks();
    responseListeners.splice(0);
    __clearInMemoryDraftsForTests();
    localStorage.clear();
    mockTranscribeAudioBlob.mockResolvedValue({ text: 'the transcript' });
    mockSpeak.mockResolvedValue({ ok: true as const, data: [82, 73, 70, 70], mimeType: 'audio/wav' });
    mockConversationGet.mockResolvedValue({ status: 'idle', extra: { workspace: '/workspace' } });
    installMediaEnvironment();
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      font: '',
      measureText: (text: string) => ({ width: text.length * 10 }),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalCanvasGetContext;
    vi.unstubAllGlobals();
  });

  /**
   * Dictation is a typing aid. It must not speak, and it must not send: the
   * words go into the draft and the user decides what happens to them. The
   * response stream is deliberately left untouched here - if dictation ever
   * opened a session, `speak` would fire without one.
   */
  it('dictation writes the transcript into the composer and stays silent', async () => {
    const { send } = renderComposer();

    await runDictation();

    await waitFor(() => expect(textarea().value).toBe('the transcript'));
    expect(mockSpeak).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(sessionState()).toBe('connecting|dead');
  });

  /**
   * The CONTROL for the test above. Without it a broken `voiceSynth` mock - or
   * a session that silently refuses to start - would make "speak was never
   * called" pass while proving nothing at all.
   */
  it('a voice conversation speaks the answer and sends the turn by itself', async () => {
    const { send, conversationId } = renderComposer();

    await speakOneTurn();

    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(send.mock.calls[0]?.[0]).toMatchObject({ input: 'the transcript' });
    expect(textarea().value).toBe('');

    await deliverAnswer(conversationId);
    await waitFor(() => expect(mockSpeak).toHaveBeenCalledWith({ text: 'Here is the answer.' }));
  });

  /**
   * Two `useSpeechInput` instances are mounted at once - the dictation button
   * owns one and the session owns another - and each holds its own
   * `getUserMedia` and its own recorder. If both ever ran over one utterance the
   * user would be transcribed twice: billed twice, and one copy auto-sent while
   * the other lands in the composer.
   */
  it('transcribes each utterance exactly once, on both paths', async () => {
    const first = renderComposer();
    await runDictation();
    expect(mockTranscribeAudioBlob).toHaveBeenCalledTimes(1);
    first.unmount();

    mockTranscribeAudioBlob.mockClear();

    renderComposer();
    await speakOneTurn();
    expect(mockTranscribeAudioBlob).toHaveBeenCalledTimes(1);
  });

  it('disables dictation while a voice session owns the microphone', async () => {
    // The mechanism behind the count above: one recorder at a time, enforced in
    // the composer rather than hoped for.
    renderComposer();

    expect(await dictationButton()).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(talkButton());
    });

    await waitFor(async () => expect(await dictationButton()).toBeDisabled());
  });
});

/**
 * V16.
 *
 * A spoken turn enters the SAME send handler as typed chat, and every one of
 * those handlers collects the staged files and clears them before dispatch. So
 * a user who attaches a photo and then speaks has the photo sent with a sentence
 * they never meant to attach it to - and cleared from the composer either way,
 * so it cannot even be re-sent correctly. While the orb was a full-screen
 * overlay that hid the composer this was nearly unreachable. Now the composer IS
 * the voice surface.
 */
describe('V16: a staged attachment defers the spoken turn to the draft', () => {
  const originalCanvasGetContext = HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    vi.clearAllMocks();
    responseListeners.splice(0);
    __clearInMemoryDraftsForTests();
    localStorage.clear();
    mockTranscribeAudioBlob.mockResolvedValue({ text: 'the transcript' });
    installMediaEnvironment();
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      font: '',
      measureText: (text: string) => ({ width: text.length * 10 }),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalCanvasGetContext;
    vi.unstubAllGlobals();
  });

  const platforms: PlatformKey[] = ['wcore', 'acp', 'gemini', 'nanobot', 'openclaw', 'remote'];

  it.each(platforms)('%s: sends nothing, keeps the words, keeps the file', async (platform) => {
    const { send } = renderComposer(platform, { stagedFile: '/tmp/photo.png' });

    await waitFor(() => expect(screen.getByTestId('staged-file')).toHaveTextContent('/tmp/photo.png'));

    await speakOneTurn();

    // Nothing dispatched: the attachment did not ride a sentence nobody chose.
    expect(send).not.toHaveBeenCalled();
    // The words are recoverable, in the one place the user can act on them.
    await waitFor(() => expect(textarea().value).toBe('the transcript'));
    // And the attachment is still there to send WITH them.
    expect(screen.getByTestId('staged-file')).toHaveTextContent('/tmp/photo.png');
  });

  it.each(platforms)('%s: auto-sends the same turn when nothing is staged', async (platform) => {
    // The CONTROL. Without it, a deferral that fired unconditionally - or a
    // composer that never reached its send handler at all - would pass every
    // assertion above.
    const { send } = renderComposer(platform);

    await speakOneTurn();

    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(send.mock.calls[0]?.[0]).toMatchObject({ input: 'the transcript' });
    expect(textarea().value).toBe('');
  });

  it('never clears the staged files on a deferred turn', async () => {
    renderComposer('wcore', { stagedFile: '/tmp/photo.png' });
    await waitFor(() => expect(screen.getByTestId('staged-file')).toBeInTheDocument());

    await speakOneTurn();
    await waitFor(() => expect(textarea().value).toBe('the transcript'));

    expect(mockClearFilesSpy).not.toHaveBeenCalled();
  });

  it('still clears them on a turn that really was sent', async () => {
    // The control for the control: `clearFiles` is reachable on this harness, so
    // the assertion above is about deferral and not about a spy that is wired to
    // nothing.
    const { send } = renderComposer('wcore');

    await speakOneTurn();
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));

    expect(mockClearFilesSpy).toHaveBeenCalled();
  });

  it('appends to a draft the user already typed rather than destroying it', async () => {
    const { conversationId } = renderComposer('wcore', { stagedFile: '/tmp/photo.png' });
    await waitFor(() => expect(screen.getByTestId('staged-file')).toBeInTheDocument());

    await act(async () => {
      fireEvent.change(textarea(), { target: { value: 'about this photo' } });
    });
    await waitFor(() => expect(textarea().value).toBe('about this photo'));

    await speakOneTurn();

    await waitFor(() => expect(textarea().value).toBe('about this photo\nthe transcript'));
    expect(conversationId).toBeTruthy();
  });
});

/**
 * V18.
 *
 * Escape is the reflexive panic key, and it lives on the SESSION rather than on
 * the orb precisely so it still works once the composer is the surface. It has
 * two meanings and they are not interchangeable: while the assistant is talking
 * it interrupts and the session survives, and otherwise it ends the session and
 * lets go of the microphone. An Escape that leaves a hot mic is the worst of the
 * available failures.
 */
describe('V18: Escape from the composer', () => {
  const originalCanvasGetContext = HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    vi.clearAllMocks();
    responseListeners.splice(0);
    __clearInMemoryDraftsForTests();
    localStorage.clear();
    mockTranscribeAudioBlob.mockResolvedValue({ text: 'the transcript' });
    mockSpeak.mockResolvedValue({ ok: true as const, data: [82, 73, 70, 70], mimeType: 'audio/wav' });
    installMediaEnvironment();
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      font: '',
      measureText: (text: string) => ({ width: text.length * 10 }),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalCanvasGetContext;
    vi.unstubAllGlobals();
  });

  const pressEscape = async (): Promise<KeyboardEvent> => {
    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true, bubbles: true });
    await act(async () => {
      window.dispatchEvent(event);
    });
    return event;
  };

  it('interrupts the assistant mid-sentence and keeps the session alive', async () => {
    const { conversationId } = renderComposer();
    await speakOneTurn();
    await deliverAnswer(conversationId);
    await waitFor(() => expect(sessionState()).toBe('speaking|live'));

    const event = await pressEscape();

    expect(event.defaultPrevented).toBe(true);
    expect(sessionState()).not.toContain('speaking');
    // Survives: the point of interrupt is to talk over the answer, not to hang up.
    expect(sessionState()).toContain('live');
  });

  it('ends the session and releases the microphone when nothing is being said', async () => {
    renderComposer();
    await act(async () => {
      fireEvent.click(talkButton());
    });
    await waitFor(() => expect(sessionState()).toBe('user-speaking|live'));
    expect(openedTracks.length).toBeGreaterThan(0);

    const event = await pressEscape();

    expect(event.defaultPrevented).toBe(true);
    await waitFor(() => expect(sessionState()).toContain('dead'));
    for (const track of openedTracks) expect(track.stop).toHaveBeenCalled();
  });

  it('does nothing and swallows nothing when there is no session', async () => {
    // The CONTROL. Escape is a global key: a listener that stayed registered, or
    // one that called preventDefault unconditionally, would quietly break every
    // dialog, menu and inline editor on the surface.
    renderComposer();
    expect(sessionState()).toBe('connecting|dead');

    const event = await pressEscape();

    expect(event.defaultPrevented).toBe(false);
    expect(sessionState()).toBe('connecting|dead');
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it('works with only the composer mounted - no orb in the tree', () => {
    // The whole reason the handler was lifted out of `VoiceConversationMode`.
    renderComposer();

    expect(screen.queryByRole('dialog', { name: 'Wayland voice conversation' })).toBeNull();
    expect(within(document.body).getByRole('textbox')).toBeInTheDocument();
  });
});

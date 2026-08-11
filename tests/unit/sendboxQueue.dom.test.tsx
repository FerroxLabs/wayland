/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SendBox from '@/renderer/components/chat/sendbox';
import { useVoiceSessionSafe, VoiceSessionProvider } from '@/renderer/pages/conversation/voice/VoiceSessionContext';

const mockWarmupInvoke = vi.fn().mockResolvedValue(undefined);
const mockWarning = vi.fn();
const mockHandlePasteFocus = vi.fn();
const mockOnPaste = vi.fn();
const mockBlurActiveElement = vi.fn();
const mockShouldBlockMobileInputFocus = vi.fn(() => false);
const mockSetSendBoxHandler = vi.fn();
const mockRemoveDomSnippet = vi.fn();
const mockClearDomSnippets = vi.fn();

let layoutState = { isMobile: false };
let conversationState: { conversationId?: string } = { conversationId: 'conversation-1' };
let previewState: {
  domSnippets: Array<{ id: string; tag: string; html: string }>;
  setSendBoxHandler: typeof mockSetSendBoxHandler;
  removeDomSnippet: typeof mockRemoveDomSnippet;
  clearDomSnippets: typeof mockClearDomSnippets;
} = {
  domSnippets: [],
  setSendBoxHandler: mockSetSendBoxHandler,
  removeDomSnippet: mockRemoveDomSnippet,
  clearDomSnippets: mockClearDomSnippets,
};
let dragUploadState = {
  isFileDragging: false,
  dragHandlers: {},
};
let uploadState = { isUploading: false };
let slashControllerArgs: {
  input: string;
  commands: Array<{ name: string; description?: string; kind?: string; source?: string }>;
  onExecuteBuiltin: (name: string) => void;
  onSelectTemplate: (name: string) => void;
} | null = null;
let slashControllerState = {
  isOpen: false,
  filteredCommands: [] as Array<{ name: string; description?: string; hint?: string }>,
  activeIndex: 0,
  setActiveIndex: vi.fn(),
  onSelectByIndex: vi.fn(),
  onKeyDown: vi.fn(),
};
let pasteServiceArgs: {
  onTextPaste?: (text: string) => void;
  conversationId?: string;
} | null = null;
// Controls the /doctor gate: the command is offered only on the local Electron
// desktop (the `doctor.run` IPC is remote-denied). Default to desktop so the
// existing merged-command assertion holds; the remote case flips this to false.
let isElectronDesktopValue = true;

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      warmup: {
        invoke: (...args: unknown[]) => mockWarmupInvoke(...args),
      },
    },
  },
}));

vi.mock('@/renderer/hooks/chat/useInputFocusRing', () => ({
  useInputFocusRing: () => ({
    activeBorderColor: '#111111',
    inactiveBorderColor: '#cccccc',
    activeShadow: '0 0 0 2px rgba(0, 0, 0, 0.2)',
  }),
}));

vi.mock('@/renderer/hooks/context/LayoutContext', () => ({
  useLayoutContext: () => layoutState,
}));

vi.mock('@/renderer/hooks/context/ConversationContext', () => ({
  useConversationContextSafe: () => conversationState,
}));

vi.mock('@/renderer/pages/conversation/Preview', () => ({
  usePreviewContext: () => previewState,
}));

vi.mock('@/renderer/hooks/chat/useCompositionInput', () => ({
  useCompositionInput: () => ({
    compositionHandlers: {},
    createKeyDownHandler:
      (onSend: () => void, onSlashKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void) =>
      (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        onSlashKeyDown?.(event);
        if (event.key === 'Enter') {
          event.preventDefault();
          onSend();
        }
      },
  }),
}));

vi.mock('@renderer/hooks/file/useDragUpload', () => ({
  useDragUpload: () => dragUploadState,
}));

vi.mock('@renderer/hooks/file/usePasteService', () => ({
  usePasteService: (args: typeof pasteServiceArgs) => {
    pasteServiceArgs = args;
    return {
      onPaste: mockOnPaste,
      onFocus: mockHandlePasteFocus,
    };
  },
}));

vi.mock('@renderer/hooks/file/useUploadState', () => ({
  useUploadState: () => uploadState,
}));

vi.mock('@renderer/components/media/UploadProgressBar', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'upload-progress' }),
}));

vi.mock('@renderer/hooks/ui/useLatestRef', async () => {
  const ReactModule = await vi.importActual<typeof import('react')>('react');
  return {
    useLatestRef: <T,>(value: T) => {
      const ref = ReactModule.useRef(value);
      ref.current = value;
      return ref;
    },
  };
});

vi.mock('@renderer/services/FileService', () => ({
  allSupportedExts: ['.txt', '.ts'],
}));

vi.mock('@/renderer/hooks/chat/useSlashCommandController', () => ({
  useSlashCommandController: (args: typeof slashControllerArgs) => {
    slashControllerArgs = args;
    return slashControllerState;
  },
}));

vi.mock('@/renderer/components/chat/SlashCommandMenu', () => ({
  __esModule: true,
  default: ({
    title,
    hint,
    items,
    activeIndex,
    onHoverItem,
    onSelectItem,
    emptyText,
  }: {
    title: string;
    hint?: string;
    items: Array<{ key: string; label: string }>;
    activeIndex: number;
    onHoverItem: (index: number) => void;
    onSelectItem: (item: { key: string; label: string }) => void;
    emptyText: string;
  }) =>
    React.createElement(
      'div',
      { 'data-testid': 'slash-menu', 'data-active-index': String(activeIndex) },
      React.createElement('div', {}, title),
      hint ? React.createElement('div', {}, hint) : null,
      items.length === 0
        ? React.createElement('div', {}, emptyText)
        : items.map((item, index) =>
            React.createElement(
              'button',
              {
                key: item.key,
                type: 'button',
                onMouseEnter: () => onHoverItem(index),
                onClick: () => onSelectItem(item),
              },
              item.label
            )
          )
    ),
}));

vi.mock('@/renderer/utils/ui/focus', () => ({
  blurActiveElement: () => mockBlurActiveElement(),
  shouldBlockMobileInputFocus: () => mockShouldBlockMobileInputFocus(),
}));

/*
 * The voice session the composer now reads. Local providers throughout, so no
 * disclosure is ever reachable and nothing here talks to a real service.
 */
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn(async (key: string) =>
      key === 'tools.speechToText'
        ? { enabled: true, provider: 'whisper-local' }
        : key === 'tools.textToSpeech'
          ? { enabled: true, provider: 'system-native', voice: 'default', speed: 1, autoReadResponses: false }
          : undefined
    ),
    set: vi.fn(async () => undefined),
  },
}));

vi.mock('@/common/adapter/ipcBridge', () => ({
  conversation: {
    stop: { invoke: vi.fn(async () => ({ success: true })) },
    responseStream: { on: () => () => {} },
    turnCompleted: { on: () => () => {} },
    confirmation: { add: { on: () => () => {} } },
  },
  voiceSynth: { speak: { invoke: vi.fn(async () => ({ ok: true, data: [1], mimeType: 'audio/wav' })) } },
  modelRegistry: { list: { invoke: vi.fn(async () => []) } },
}));

vi.mock('@/renderer/hooks/system/useSpeechInput', () => ({
  useSpeechInput: () => ({
    availability: 'record',
    cancelRecording: vi.fn(),
    clearError: vi.fn(),
    errorCode: null,
    recordingLevels: [],
    startMonitoring: vi.fn(async () => undefined),
    startRecording: vi.fn(async () => undefined),
    status: 'idle',
    stopMonitoring: vi.fn(),
    stopRecording: vi.fn(),
  }),
}));

// Partial, so a new export the tree reaches is not an undefined-export crash.
vi.mock('@/renderer/utils/platform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/renderer/utils/platform')>()),
  isElectronDesktop: () => isElectronDesktopValue,
  // Read by the voice session: only macOS has a local speech synthesizer.
  isMacOS: () => true,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

vi.mock('@icon-park/react', () => ({
  ArrowUp: () => React.createElement('span', {}, 'ArrowUp'),
  CloseSmall: () => React.createElement('span', {}, 'CloseSmall'),
}));

vi.mock('@arco-design/web-react', () => ({
  /*
   * Forwards the accessible name the component actually passes, instead of
   * inventing one from the className.
   *
   * The old mock synthesized 'send' and 'stop', which meant every
   * accessible-name assertion in this file was testing the mock. The real
   * buttons had no name at all, and a component like VoiceModeEntryButton -
   * which DOES set aria-label - came back with null here. Any a11y work checked
   * through this harness would have shipped green and unverified.
   */
  Button: ({
    children,
    icon,
    className,
    disabled,
    onClick,
    ...rest
  }: {
    children?: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
    type?: string;
    'aria-label'?: string;
    title?: string;
  }) =>
    React.createElement(
      'button',
      {
        type: 'button',
        className,
        disabled,
        onClick,
        'aria-label': rest['aria-label'],
        title: rest.title,
      },
      children ?? icon
    ),
  Input: {
    TextArea: ({
      children,
      autoSize: _autoSize,
      onChange,
      ...props
    }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
      autoSize?: boolean | { minRows?: number; maxRows?: number };
      children?: React.ReactNode;
    }) =>
      React.createElement(
        'textarea',
        {
          ...props,
          onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(event.target.value),
        },
        children
      ),
  },
  // Rendered by the hosted-voice consent hook the provider mounts. Inert here:
  // every test below is on the local path, so nothing ever opens it.
  Modal: ({ children, visible }: { children?: React.ReactNode; visible?: boolean }) =>
    visible ? React.createElement('div', { role: 'dialog' }, children) : null,
  // The speech buttons now render in this harness, and they wrap in a Tooltip.
  Tooltip: ({ children }: { children?: React.ReactNode }) => children ?? null,
  Message: {
    useMessage: () => [{ warning: mockWarning }, React.createElement('div', { 'data-testid': 'message-context' })],
  },
  Tag: ({ children, onClose }: { children: React.ReactNode; closable?: boolean; onClose?: () => void }) =>
    React.createElement(
      'div',
      {},
      React.createElement('span', {}, children),
      React.createElement(
        'button',
        {
          type: 'button',
          'aria-label': `remove-${String(children)}`,
          onClick: onClose,
        },
        'remove'
      )
    ),
}));

const renderControlledSendBox = (
  props: Partial<React.ComponentProps<typeof SendBox>> & { initialValue?: string } = {}
) => {
  const { initialValue = '', onSend = vi.fn().mockResolvedValue(undefined), onStop, ...restProps } = props;

  const Harness = () => {
    const [value, setValue] = React.useState(initialValue);
    return (
      <>
        <SendBox value={value} onChange={setValue} onSend={onSend} onStop={onStop} {...restProps} />
        <div data-testid='current-value'>{value}</div>
      </>
    );
  };

  return {
    ...render(<Harness />),
    onSend,
    onStop,
  };
};

const getTextarea = (): HTMLTextAreaElement => {
  const textarea = screen.getByRole('textbox');
  if (!(textarea instanceof HTMLTextAreaElement)) {
    throw new Error('Expected textarea');
  }
  return textarea;
};

describe('SendBox queue and interaction behaviors', () => {
  const originalCanvasGetContext = HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    layoutState = { isMobile: false };
    conversationState = { conversationId: 'conversation-1' };
    previewState = {
      domSnippets: [],
      setSendBoxHandler: mockSetSendBoxHandler,
      removeDomSnippet: mockRemoveDomSnippet,
      clearDomSnippets: mockClearDomSnippets,
    };
    dragUploadState = {
      isFileDragging: false,
      dragHandlers: {},
    };
    uploadState = { isUploading: false };
    slashControllerArgs = null;
    slashControllerState = {
      isOpen: false,
      filteredCommands: [],
      activeIndex: 0,
      setActiveIndex: vi.fn(),
      onSelectByIndex: vi.fn(),
      onKeyDown: vi.fn(),
    };
    pasteServiceArgs = null;
    isElectronDesktopValue = true;
    mockShouldBlockMobileInputFocus.mockReturnValue(false);

    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      font: '',
      measureText: (text: string) => ({ width: text.length * 10 }),
    })) as typeof HTMLCanvasElement.prototype.getContext;
    globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), 0)) as typeof globalThis.requestAnimationFrame;
    globalThis.cancelAnimationFrame = ((handle: number) => {
      window.clearTimeout(handle);
    }) as typeof globalThis.cancelAnimationFrame;
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalCanvasGetContext;
    vi.useRealTimers();
  });

  it('registers the preview handler, appends snippet text, and cleans up on unmount', async () => {
    const { unmount } = renderControlledSendBox({ initialValue: 'base text' });

    expect(mockSetSendBoxHandler).toHaveBeenCalledTimes(1);
    const registeredHandler = mockSetSendBoxHandler.mock.calls[0]?.[0] as ((text: string) => void) | undefined;
    expect(registeredHandler).toBeTypeOf('function');

    await act(async () => {
      registeredHandler?.('new snippet');
    });

    expect(getTextarea().value).toBe('base text\n\nnew snippet');

    unmount();

    expect(mockSetSendBoxHandler).toHaveBeenLastCalledWith(null);
  });

  it('sends input with DOM snippets, clears draft state, and removes snippet tags', async () => {
    previewState.domSnippets = [
      { id: 'dom-1', tag: 'main', html: '<main>Hello</main>' },
      { id: 'dom-2', tag: 'aside', html: '<aside>World</aside>' },
    ];

    const onSend = vi.fn().mockResolvedValue(undefined);
    renderControlledSendBox({ initialValue: 'Inspect page', onSend });

    fireEvent.click(screen.getByRole('button', { name: 'remove-main' }));
    expect(mockRemoveDomSnippet).toHaveBeenCalledWith('dom-1');

    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledTimes(1);
    });

    expect(onSend).toHaveBeenCalledWith(
      expect.stringContaining('Inspect page\n\n---\nDOM Snippet (main):\n```html\n<main>Hello</main>\n```')
    );
    expect(onSend).toHaveBeenCalledWith(expect.stringContaining('DOM Snippet (aside):'));
    expect(mockClearDomSnippets).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('current-value')).toHaveTextContent('');
  });

  it('blocks Enter-submit while loading when queueing is not allowed', () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    renderControlledSendBox({
      initialValue: 'queued text',
      loading: true,
      onSend,
    });

    fireEvent.keyDown(getTextarea(), { key: 'Enter' });

    expect(mockWarning).toHaveBeenCalledWith('messages.conversationInProgress');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('uses the stop control in the shared action slot while loading without a queued draft', async () => {
    const onStop = vi.fn().mockResolvedValue(undefined);
    renderControlledSendBox({
      loading: true,
      allowSendWhileLoading: true,
      onStop,
    });

    expect(screen.getByRole('button', { name: 'Stop generating' })).toHaveClass('sendbox-stop-button');
    expect(screen.queryByRole('button', { name: 'Send message' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Stop generating' }));
    await waitFor(() => {
      expect(onStop).toHaveBeenCalledTimes(1);
    });
  });

  it('switches the shared action slot back to send when queueing a new message during loading', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    const onStop = vi.fn().mockResolvedValue(undefined);
    renderControlledSendBox({
      loading: true,
      allowSendWhileLoading: true,
      onSend,
      onStop,
    });

    fireEvent.change(getTextarea(), {
      target: { value: 'continue anyway' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith('continue anyway');
    });
    expect(onStop).not.toHaveBeenCalled();
  });

  it('disables sending while uploads are still in progress', () => {
    uploadState = { isUploading: true };

    renderControlledSendBox({
      initialValue: 'waiting for file upload',
    });

    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send message' })).toHaveClass('send-button-custom');
  });

  it('renders slash commands, forwards selection, and exposes merged builtin commands', async () => {
    slashControllerState = {
      ...slashControllerState,
      isOpen: true,
      filteredCommands: [
        { name: 'open', description: 'Add file' },
        { name: 'plan', description: 'Plan next step' },
      ],
    };

    renderControlledSendBox({
      slashCommands: [
        { name: 'open', description: 'Duplicate builtin', kind: 'builtin', source: 'custom' },
        { name: 'plan', description: 'Plan next step', kind: 'template', source: 'custom' },
      ],
      onSlashBuiltinCommand: vi.fn(),
    });

    expect(screen.getByTestId('slash-menu')).toBeInTheDocument();
    expect(screen.getByText('/open')).toBeInTheDocument();
    expect(screen.getByText('/plan')).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByText('/plan'));
    expect(slashControllerState.setActiveIndex).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText('/plan'));
    expect(slashControllerState.onSelectByIndex).toHaveBeenCalledWith(1);

    expect(slashControllerArgs?.commands.map((command) => command.name)).toEqual([
      'open',
      'copy',
      'export',
      'doctor',
      'plan',
    ]);
  });

  it('omits the /doctor builtin in a remote (non-desktop) session', () => {
    // The doctor.run IPC is remote-denied, so a paired WebUI must not be offered
    // /doctor — it would open the modal only for the run to be dropped.
    isElectronDesktopValue = false;

    renderControlledSendBox({
      slashCommands: [{ name: 'plan', description: 'Plan next step', kind: 'template', source: 'custom' }],
      onSlashBuiltinCommand: vi.fn(),
    });

    const commandNames = slashControllerArgs?.commands.map((command) => command.name) ?? [];
    expect(commandNames).not.toContain('doctor');
    expect(commandNames).toEqual(['open', 'copy', 'export', 'plan']);
  });

  it('executes builtin slash actions and template selection through the controller callbacks', async () => {
    const onSlashBuiltinCommand = vi.fn();
    renderControlledSendBox({
      initialValue: 'draft command',
      slashCommands: [{ name: 'review', description: 'Review code', kind: 'template', source: 'custom' }],
      onSlashBuiltinCommand,
    });

    expect(slashControllerArgs).not.toBeNull();

    await act(async () => {
      slashControllerArgs?.onExecuteBuiltin('open');
    });

    expect(onSlashBuiltinCommand).toHaveBeenCalledWith('open');
    expect(screen.getByTestId('current-value')).toHaveTextContent('');

    await act(async () => {
      slashControllerArgs?.onSelectTemplate('review');
    });

    expect(getTextarea().value).toBe('/review ');
  });

  it('inserts pasted text at the current cursor position and restores selection', async () => {
    vi.useFakeTimers();

    renderControlledSendBox({ initialValue: 'HelloWorld' });

    const textarea = getTextarea();
    textarea.focus();
    textarea.setSelectionRange(5, 5);

    await act(async () => {
      pasteServiceArgs?.onTextPaste?.(' ');
    });

    expect(screen.getByTestId('current-value')).toHaveTextContent('Hello World');

    act(() => {
      vi.runAllTimers();
    });

    expect(textarea.selectionStart).toBe(6);
    expect(textarea.selectionEnd).toBe(6);
  });

  it('falls back to replacing the draft when paste text arrives without an active textarea', async () => {
    renderControlledSendBox({ initialValue: 'Old draft' });

    const textarea = getTextarea();
    textarea.blur();
    document.body.focus();

    await act(async () => {
      pasteServiceArgs?.onTextPaste?.('Fresh draft');
    });

    expect(screen.getByTestId('current-value')).toHaveTextContent('Fresh draft');
  });

  it('keeps short text single-line and switches to multiline for newline or very long input', () => {
    const { rerender } = render(
      <SendBox value='tiny' onChange={vi.fn()} onSend={vi.fn().mockResolvedValue(undefined)} />
    );

    expect(getTextarea().style.height).toBe('20px');

    rerender(<SendBox value={'short\nline'} onChange={vi.fn()} onSend={vi.fn().mockResolvedValue(undefined)} />);
    expect(getTextarea().style.minHeight).toBe('40px');

    rerender(<SendBox value={'x'.repeat(810)} onChange={vi.fn()} onSend={vi.fn().mockResolvedValue(undefined)} />);
    expect(getTextarea().style.minHeight).toBe('40px');
  });

  it('blurs mobile autofocus on mount and rejects focus without explicit user intent', () => {
    vi.useFakeTimers();
    layoutState = { isMobile: true };

    renderControlledSendBox();

    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(mockBlurActiveElement).toHaveBeenCalledTimes(1);

    fireEvent.focus(getTextarea());

    expect(mockBlurActiveElement).toHaveBeenCalledTimes(2);
    expect(mockHandlePasteFocus).not.toHaveBeenCalled();
  });

  it('blocks mobile focus when the platform reports focus should be suppressed', () => {
    layoutState = { isMobile: true };
    mockShouldBlockMobileInputFocus.mockReturnValue(true);

    renderControlledSendBox();

    fireEvent.mouseDown(getTextarea());
    fireEvent.focus(getTextarea());

    expect(mockBlurActiveElement).toHaveBeenCalled();
    expect(mockHandlePasteFocus).not.toHaveBeenCalled();
  });

  it('accepts mobile focus after touch intent and warms the conversation once the debounce completes', () => {
    vi.useFakeTimers();
    layoutState = { isMobile: true };

    renderControlledSendBox();

    const textarea = getTextarea();
    fireEvent.touchStart(textarea);
    fireEvent.focus(textarea);

    expect(mockHandlePasteFocus).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockWarmupInvoke).toHaveBeenCalledWith({ conversation_id: 'conversation-1' });
  });

  /**
   * Both layout branches render the same controls.
   *
   * They were byte-identical copies, which looked like harmless duplication and
   * was not: NanobotSendBox passes neither defaultMultiLine nor lockMultiLine,
   * so the single-line branch is live for real users there. One edited copy is
   * a silent per-platform divergence, and no test would have noticed.
   */
  it.each([
    ['single line', false],
    ['multi line', true],
  ])('renders the same composer controls in %s mode', (_name, defaultMultiLine) => {
    renderControlledSendBox({ defaultMultiLine, initialValue: 'hello' });

    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument();
  });

  describe('voice status in the composer', () => {
    // `useConversationContextSafe` is already mocked to conversation-1 in this
    // file, so the provider's scoping check matches without a second provider.
    const VoiceHarness: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <VoiceSessionProvider conversationId='conversation-1' actorLabel='Wayland'>
        {children}
      </VoiceSessionProvider>
    );

    const Starter: React.FC = () => {
      const session = useVoiceSessionSafe();
      return (
        <button type='button' onClick={() => void session?.begin()}>
          start-voice
        </button>
      );
    };

    /**
     * The assertion a placeholder-based status cannot pass.
     *
     * A placeholder does not render over a non-empty value, and typing during a
     * session has to keep working - so the moment the user types one character,
     * a placeholder-based design has silently deleted its own status channel.
     * In `listening` that placeholder would also have been the only indication
     * the microphone was open.
     */
    it('keeps the status visible once the user starts typing', async () => {
      render(
        <VoiceHarness>
          <Starter />
          <SendBox value='' onChange={vi.fn()} onSend={vi.fn().mockResolvedValue(undefined)} />
        </VoiceHarness>
      );

      await act(async () => {
        screen.getByRole('button', { name: 'start-voice' }).click();
      });
      expect(await screen.findByTestId('composer-voice-status')).toBeInTheDocument();

      // Re-render with a non-empty draft, exactly as typing would.
      render(
        <VoiceHarness>
          <Starter />
          <SendBox value='a typed draft' onChange={vi.fn()} onSend={vi.fn().mockResolvedValue(undefined)} />
        </VoiceHarness>
      );
      await act(async () => {
        screen.getAllByRole('button', { name: 'start-voice' })[1].click();
      });

      expect(screen.getAllByTestId('composer-voice-status').length).toBeGreaterThan(0);
    });

    it('never shows the working indicator and the voice status at once', async () => {
      render(
        <VoiceHarness>
          <Starter />
          <SendBox value='' onChange={vi.fn()} onSend={vi.fn().mockResolvedValue(undefined)} loading />
        </VoiceHarness>
      );

      await act(async () => {
        screen.getByRole('button', { name: 'start-voice' }).click();
      });

      // `loading` is set, so without the swap both would render.
      expect(await screen.findByTestId('composer-voice-status')).toBeInTheDocument();
      expect(screen.getAllByRole('status')).toHaveLength(1);
      expect(screen.queryByText('Working...')).not.toBeInTheDocument();
    });

    /**
     * The composer is the only place a session is visible once the orb is
     * collapsed, so it has to be the place a session can be STOPPED. A surface
     * that starts a continuously re-arming microphone and offers no way out is
     * the one shape this must never take.
     */
    it('the soundwave ends a live session instead of restarting it', async () => {
      render(
        <VoiceHarness>
          <SendBox value='' onChange={vi.fn()} onSend={vi.fn().mockResolvedValue(undefined)} />
        </VoiceHarness>
      );

      const talk = screen.getByRole('button', { name: 'Talk with Wayland' });
      await act(async () => {
        talk.click();
      });
      expect(await screen.findByTestId('composer-voice-status')).toBeInTheDocument();

      await act(async () => {
        screen.getByRole('button', { name: 'End voice conversation' }).click();
      });
      expect(screen.queryByTestId('composer-voice-status')).not.toBeInTheDocument();
    });

    it('offers exactly one way into a voice conversation', async () => {
      render(
        <VoiceHarness>
          <SendBox value='' onChange={vi.fn()} onSend={vi.fn().mockResolvedValue(undefined)} />
        </VoiceHarness>
      );
      // Two entry points 17px apart, named "Start Voice conversation" and
      // "Start voice input", were indistinguishable to a screen reader.
      expect(screen.getAllByRole('button', { name: /Talk with Wayland/i })).toHaveLength(1);
    });

    it('offers a mute while the microphone is open', async () => {
      render(
        <VoiceHarness>
          <SendBox value='' onChange={vi.fn()} onSend={vi.fn().mockResolvedValue(undefined)} />
        </VoiceHarness>
      );
      await act(async () => {
        screen.getByRole('button', { name: 'Talk with Wayland' }).click();
      });

      // The orb owned the only mute in the product; collapsing it would have
      // deleted "stop listening" from reach entirely.
      expect(await screen.findByRole('button', { name: /mute microphone/i })).toBeInTheDocument();
    });

    it('leaves the working indicator exactly as it was with no voice session', () => {
      // The control: outside a provider every voice read is null, so the
      // composer must behave precisely as it does today.
      render(<SendBox value='' onChange={vi.fn()} onSend={vi.fn().mockResolvedValue(undefined)} loading />);

      expect(screen.getByText('Working...')).toBeInTheDocument();
      expect(screen.queryByTestId('composer-voice-status')).not.toBeInTheDocument();
    });

    /**
     * Two gates on two different axes, and each has to be pinned separately -
     * a single "voice controls are enabled" assertion would pass with either
     * one deleted.
     *
     * The dictation mic's accessible name comes back as the raw i18n key here:
     * SpeechInputButton calls `t(tooltipKey)` with no defaultValue, and this
     * file's `t` mock returns the key when there is none.
     */
    const DICTATION_LABEL = 'conversation.chat.speech.recordTooltip';

    it('keeps both voice controls alive while a reply is streaming', async () => {
      // The axis the fix was for. Both buttons were gated on `isLoading ||
      // loading`, so the soundwave went dead the instant an answer started -
      // which is exactly when barge-in and stop-speaking are reached for.
      render(<SendBox value='' onChange={vi.fn()} onSend={vi.fn().mockResolvedValue(undefined)} loading />);

      // The mic mounts only after its stored config resolves.
      expect(await screen.findByRole('button', { name: DICTATION_LABEL })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'Talk with Wayland' })).not.toBeDisabled();
    });

    it('closes dictation during a live session but leaves the way out open', async () => {
      // The other axis, and it is not about loading at all: SpeechInputButton
      // owns its own useSpeechInput and therefore its own getUserMedia, so
      // tapping it mid-session opens a second recorder over the same audio.
      // The soundwave must stay live regardless - it is the way out.
      render(
        <VoiceHarness>
          <SendBox value='' onChange={vi.fn()} onSend={vi.fn().mockResolvedValue(undefined)} />
        </VoiceHarness>
      );

      expect(await screen.findByRole('button', { name: DICTATION_LABEL })).not.toBeDisabled();

      await act(async () => {
        screen.getByRole('button', { name: 'Talk with Wayland' }).click();
      });
      expect(await screen.findByTestId('composer-voice-status')).toBeInTheDocument();

      expect(screen.getByRole('button', { name: DICTATION_LABEL })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'End voice conversation' })).not.toBeDisabled();
    });

    it('still closes both controls when the whole composer is disabled', async () => {
      // The relaxation has a floor: `disabled` is the caller saying this
      // composer is not usable at all, and voice is not an exception to it.
      render(<SendBox value='' onChange={vi.fn()} onSend={vi.fn().mockResolvedValue(undefined)} disabled loading />);

      expect(await screen.findByRole('button', { name: DICTATION_LABEL })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Talk with Wayland' })).toBeDisabled();
    });
  });
});

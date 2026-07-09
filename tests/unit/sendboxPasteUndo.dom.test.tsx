/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression test for #669: Cmd+Z (undo) does not undo pasted text in the
 * chat composer.
 *
 * The composer intercepts text paste (PasteService) and used to insert the
 * cleaned text programmatically via setState, which bypasses the browser's
 * native undo stack and makes Cmd+Z a no-op. The fix inserts the text through
 * the browser's editing pipeline (document.execCommand('insertText')) so the
 * paste is recorded as an undoable edit.
 *
 * jsdom has no native editing pipeline, so this test emulates Chromium's
 * behavior: execCommand('insertText') snapshots the value on an undo stack,
 * applies the insertion, and fires a native input event; Cmd+Z triggers the
 * native undo which restores the snapshot and fires another input event.
 */
import SendBox from '@/renderer/components/chat/sendbox';
import { ConversationProvider } from '@/renderer/hooks/context/ConversationContext';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockWarmupInvoke = vi.fn().mockResolvedValue(undefined);
const mockListWorkspaceFilesInvoke = vi.fn().mockResolvedValue([]);

vi.mock('@/common', () => ({
  ipcBridge: {
    conversation: {
      warmup: {
        invoke: (...args: unknown[]) => mockWarmupInvoke(...args),
      },
    },
    fs: {
      listWorkspaceFiles: {
        invoke: (...args: unknown[]) => mockListWorkspaceFilesInvoke(...args),
      },
      createUploadFile: { invoke: vi.fn() },
      writeFile: { invoke: vi.fn() },
    },
  },
}));

vi.mock('@/renderer/utils/emitter', () => ({
  emitter: {
    emit: vi.fn(),
  },
  useAddEventListener: vi.fn(),
}));

vi.mock('@/renderer/hooks/context/LayoutContext', () => ({
  useLayoutContext: () => ({ isMobile: false }),
}));

vi.mock('@/renderer/hooks/chat/useInputFocusRing', () => ({
  useInputFocusRing: () => ({
    activeBorderColor: 'var(--color-border-2)',
    inactiveBorderColor: 'var(--color-border-2)',
    activeShadow: 'none',
  }),
}));

vi.mock('@/renderer/hooks/file/useDragUpload', () => ({
  useDragUpload: () => ({
    isFileDragging: false,
    dragHandlers: {},
  }),
}));

// NOTE: usePasteService and PasteService are intentionally NOT mocked — this
// test exercises the real paste interception path end-to-end.

vi.mock('@renderer/hooks/ui/useLatestRef', () => ({
  useLatestRef: (value: unknown) => ({ current: value }),
}));

vi.mock('@renderer/hooks/file/useUploadState', () => ({
  useUploadState: () => ({ isUploading: false }),
  trackUpload: vi.fn(() => ({ id: 1, onProgress: vi.fn(), finish: vi.fn() })),
}));

vi.mock('@renderer/services/FileService', () => ({
  allSupportedExts: [],
  getFileExtension: (name: string) => {
    const idx = name.lastIndexOf('.');
    return idx > 0 ? name.slice(idx) : '';
  },
  uploadFileViaHttp: vi.fn(),
}));

vi.mock('@/renderer/utils/platform', () => ({
  isElectronDesktop: () => true,
}));

vi.mock('@/renderer/components/media/UploadProgressBar', () => ({
  __esModule: true,
  default: () => React.createElement('div', {}, 'UploadProgressBar'),
}));

vi.mock('@/renderer/components/chat/SpeechInputButton', () => ({
  __esModule: true,
  default: () => React.createElement('div', {}, 'SpeechInputButton'),
}));

vi.mock('@/renderer/components/chat/BtwOverlay', () => ({
  __esModule: true,
  default: () => React.createElement('div', {}, 'BtwOverlay'),
}));

vi.mock('@/renderer/components/chat/BtwOverlay/useBtwCommand', () => ({
  useBtwCommand: () => ({
    answer: '',
    ask: vi.fn(),
    dismiss: vi.fn(),
    isLoading: false,
    isOpen: false,
    question: '',
  }),
}));

vi.mock('@/renderer/pages/conversation/Preview', () => ({
  usePreviewContext: () => ({
    setSendBoxHandler: vi.fn(),
    domSnippets: [],
    removeDomSnippet: vi.fn(),
    clearDomSnippets: vi.fn(),
  }),
}));

vi.mock('@/renderer/hooks/chat/useSlashCommandController', () => ({
  useSlashCommandController: () => ({
    isOpen: false,
    filteredCommands: [],
    activeIndex: 0,
    setActiveIndex: vi.fn(),
    onSelectByIndex: vi.fn(),
    onKeyDown: vi.fn(() => false),
  }),
}));

vi.mock('@/renderer/hooks/chat/useCompositionInput', () => ({
  useCompositionInput: () => ({
    compositionHandlers: {},
    createKeyDownHandler: (onEnterPress: () => void, onKeyDownIntercept?: (e: React.KeyboardEvent) => boolean) => {
      return (event: React.KeyboardEvent) => {
        if (onKeyDownIntercept?.(event)) {
          return;
        }
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          onEnterPress();
        }
      };
    },
  }),
}));

vi.mock('@/renderer/hooks/file/useConversationExport', () => ({
  useConversationExport: () => ({
    activeIndex: 0,
    closeExportFlow: vi.fn(),
    filename: '',
    handleKeyDown: vi.fn(() => false),
    isOpen: false,
    loading: false,
    menuItems: [],
    openExportFlow: vi.fn(),
    onSelectMenuItem: vi.fn(),
    pathPreview: '',
    setActiveIndex: vi.fn(),
    setFilename: vi.fn(),
    showMenu: vi.fn(),
    step: 'menu',
    submitFilename: vi.fn(),
  }),
}));

vi.mock('@/renderer/utils/ui/focus', () => ({
  blurActiveElement: vi.fn(),
  shouldBlockMobileInputFocus: vi.fn(() => false),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue || key,
    i18n: {
      language: 'en-US',
    },
  }),
}));

vi.mock('@arco-design/web-react', () => ({
  Button: ({ onClick, children, icon, ...props }: React.ComponentProps<'button'>) =>
    React.createElement('button', { onClick, ...props }, icon ?? children),
  Input: {
    TextArea: ({
      onKeyDown,
      onChange,
      onFocus,
      onBlur,
      onClick,
      onKeyUp,
      onSelect,
      value,
      ...props
    }: React.ComponentProps<'textarea'> & { value?: string }) =>
      React.createElement('textarea', {
        onKeyDown,
        onFocus,
        onBlur,
        onClick,
        onKeyUp,
        onSelect,
        onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(event.target.value),
        value,
        ...props,
      }),
  },
  Message: {
    useMessage: () => [{ warning: vi.fn() }, null],
    error: vi.fn(),
    warning: vi.fn(),
  },
  Tag: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
}));

vi.mock('@icon-park/react', () => ({
  ArrowUp: () => React.createElement('span', {}, 'ArrowUp'),
  CloseSmall: () => React.createElement('span', {}, 'CloseSmall'),
  Quote: () => React.createElement('span', {}, 'Quote'),
}));

vi.mock('lucide-react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('lucide-react')>()),
  ArrowUp: () => React.createElement('span', {}, 'ArrowUp'),
  X: () => React.createElement('span', {}, 'CloseSmall'),
  Quote: () => React.createElement('span', {}, 'Quote'),
}));

const SendBoxHarness: React.FC = () => {
  const [value, setValue] = useState('');

  return (
    <ConversationProvider value={{ conversationId: 'conv-1', workspace: '/workspace', type: 'gemini' }}>
      <div>
        <div data-testid='composer-state-value'>{value}</div>
        <SendBox value={value} onChange={setValue} onSend={vi.fn().mockResolvedValue(undefined)} />
      </div>
    </ConversationProvider>
  );
};

/** Set a textarea's value through the prototype setter so React's internal
 * value tracker does not swallow the subsequent input event (this is what a
 * real browser edit does). */
function setNativeTextAreaValue(el: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(el, value);
}

interface UndoSnapshot {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

/**
 * Emulate Chromium's editing pipeline for textareas:
 * - execCommand('insertText') records an undo snapshot, applies the insertion
 *   at the current selection, and fires a native (trusted-like) input event.
 * - execCommand('undo') pops the snapshot, restores value + selection, and
 *   fires an input event.
 * Returns the undo stack for assertions.
 */
function installExecCommandEmulation(): UndoSnapshot[] {
  const undoStack: UndoSnapshot[] = [];
  document.execCommand = vi.fn((command: string, _showUI?: boolean, text?: string): boolean => {
    const el = document.activeElement;
    if (!(el instanceof HTMLTextAreaElement)) {
      return false;
    }
    if (command === 'insertText') {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? start;
      undoStack.push({ value: el.value, selectionStart: start, selectionEnd: end });
      const inserted = text ?? '';
      setNativeTextAreaValue(el, el.value.slice(0, start) + inserted + el.value.slice(end));
      el.setSelectionRange(start + inserted.length, start + inserted.length);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
    if (command === 'undo') {
      const snapshot = undoStack.pop();
      if (!snapshot) {
        return false;
      }
      setNativeTextAreaValue(el, snapshot.value);
      el.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
    return false;
  }) as typeof document.execCommand;
  return undoStack;
}

function pasteText(textarea: HTMLTextAreaElement, text: string): boolean {
  return fireEvent.paste(textarea, {
    clipboardData: {
      getData: (type: string) => (type === 'text' ? text : ''),
      files: [],
    },
  });
}

describe('SendBox paste undo (#669)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    // @ts-expect-error cleanup emulated execCommand between tests
    delete document.execCommand;
  });

  it('pasting inserts through the editing pipeline and Cmd+Z restores the prior text', async () => {
    const undoStack = installExecCommandEmulation();
    render(<SendBoxHarness />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

    // 1. Type some text ("hello world") and place the caret at the end.
    textarea.focus();
    fireEvent.change(textarea, { target: { value: 'hello world' } });
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    expect(textarea).toHaveValue('hello world');

    // 2. Paste additional text (Cmd+V).
    pasteText(textarea, ' pasted');

    // The paste must land on the native undo stack (editing pipeline), and
    // React state must stay in sync with the DOM value.
    await waitFor(() => {
      expect(textarea).toHaveValue('hello world pasted');
    });
    expect(screen.getByTestId('composer-state-value')).toHaveTextContent('hello world pasted');
    expect(undoStack).toHaveLength(1);
    expect(document.execCommand).toHaveBeenCalledWith('insertText', false, ' pasted');

    // 3. Press Cmd+Z. The composer must not intercept it; the browser then
    // performs the native undo (emulated here by execCommand('undo')).
    const keydownNotPrevented = fireEvent.keyDown(textarea, { key: 'z', metaKey: true });
    expect(keydownNotPrevented).toBe(true);
    document.execCommand('undo');

    // 4. The pasted text is removed and the pre-paste content is restored,
    // both in the DOM and in React state.
    await waitFor(() => {
      expect(textarea).toHaveValue('hello world');
    });
    expect(screen.getByTestId('composer-state-value')).toHaveTextContent('hello world');
    expect(undoStack).toHaveLength(0);
  });

  it('inserts at the caret position, not at the end', async () => {
    installExecCommandEmulation();
    render(<SendBoxHarness />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    textarea.focus();
    fireEvent.change(textarea, { target: { value: 'hello world' } });
    // Caret after "hello".
    textarea.setSelectionRange(5, 5);

    pasteText(textarea, ' pasted');

    await waitFor(() => {
      expect(textarea).toHaveValue('hello pasted world');
    });
    expect(textarea.selectionStart).toBe('hello pasted'.length);

    document.execCommand('undo');
    await waitFor(() => {
      expect(textarea).toHaveValue('hello world');
    });
  });

  it('falls back to programmatic insertion when execCommand is unavailable', async () => {
    // No execCommand emulation installed: jsdom has no document.execCommand,
    // which mirrors environments where the editing pipeline is unavailable.
    expect(typeof document.execCommand).toBe('undefined');
    render(<SendBoxHarness />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    textarea.focus();
    fireEvent.change(textarea, { target: { value: 'hello world' } });
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    pasteText(textarea, ' pasted');

    // Paste still works (undo cannot be recorded on this path).
    await waitFor(() => {
      expect(textarea).toHaveValue('hello world pasted');
    });
    expect(screen.getByTestId('composer-state-value')).toHaveTextContent('hello world pasted');
  });
});

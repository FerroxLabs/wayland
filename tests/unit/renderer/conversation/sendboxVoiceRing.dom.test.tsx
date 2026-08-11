/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * V13 - the composer's voice ring.
 *
 * Listening and speaking must be tellable apart WITHOUT reading the caption.
 * The microphone reopens by itself 350ms after every answer, stays open up to
 * 8s, and auto-sends whatever it hears; if "it is hearing me" looks the same as
 * "it is talking", the user cannot know which one is happening to them.
 *
 * The real provider is mocked out here on purpose. These assertions need the
 * session parked in one exact state at a time, and driving the real hook there
 * would mean faking audio, timers and transcription to test a className.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

type Ring = {
  isActive: boolean;
  state: string;
  level: number;
};

let session: Ring | null = null;

vi.mock('@/renderer/pages/conversation/voice/VoiceSessionContext', () => ({
  useVoiceSessionSafe: () => (session === null ? null : { ...session, isExpanded: false }),
  VoiceSessionProvider: ({ children }: { children?: React.ReactNode }) => children ?? null,
}));

vi.mock('@/common', () => ({
  ipcBridge: { conversation: { warmup: { invoke: vi.fn(async () => undefined) } } },
}));
vi.mock('@/renderer/hooks/chat/useInputFocusRing', () => ({
  useInputFocusRing: () => ({
    activeBorderColor: '#111111',
    inactiveBorderColor: '#cccccc',
    activeShadow: '0 0 0 2px rgba(0,0,0,0.2)',
  }),
}));
vi.mock('@/renderer/hooks/context/LayoutContext', () => ({ useLayoutContext: () => ({ isMobile: false }) }));
vi.mock('@/renderer/hooks/context/ConversationContext', () => ({
  useConversationContextSafe: () => ({ conversationId: 'conversation-1' }),
}));
vi.mock('@/renderer/pages/conversation/Preview', () => ({
  usePreviewContext: () => ({
    domSnippets: [],
    setSendBoxHandler: vi.fn(),
    removeDomSnippet: vi.fn(),
    clearDomSnippets: vi.fn(),
  }),
}));
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
vi.mock('@renderer/services/FileService', () => ({ allSupportedExts: ['.txt'] }));
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
vi.mock('@/renderer/utils/platform', () => ({
  isElectronDesktop: () => true,
  isMacOS: () => true,
  rendererPlatform: () => 'darwin',
}));
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: { get: vi.fn(async () => undefined), set: vi.fn(async () => undefined) },
}));
vi.mock('@/renderer/components/chat/SpeechInputButton', () => ({ __esModule: true, default: () => null }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? k }),
}));
vi.mock('@icon-park/react', () => ({
  ArrowUp: () => null,
  CloseSmall: () => null,
}));
vi.mock('@arco-design/web-react', () => ({
  Button: ({ children, icon, ...rest }: Record<string, unknown> & { children?: React.ReactNode; icon?: React.ReactNode }) =>
    React.createElement('button', { type: 'button', ...rest }, (children as React.ReactNode) ?? icon),
  Input: {
    TextArea: ({ onChange, autoSize: _a, ...props }: Record<string, unknown> & { onChange?: (v: string) => void }) =>
      React.createElement('textarea', {
        ...props,
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value),
      }),
  },
  Modal: () => null,
  Tooltip: ({ children }: { children?: React.ReactNode }) => children ?? null,
  Message: { useMessage: () => [{ warning: vi.fn() }, null] },
  Tag: ({ children }: { children?: React.ReactNode }) => React.createElement('div', {}, children),
}));

import SendBox from '@/renderer/components/chat/sendbox';

const panelOf = (container: HTMLElement): HTMLElement => {
  const panel = container.querySelector<HTMLElement>('.sendbox-panel');
  if (!panel) throw new Error('sendbox panel not found');
  return panel;
};

const renderComposer = () =>
  render(<SendBox value='' onChange={vi.fn()} onSend={vi.fn().mockResolvedValue(undefined)} />);

describe('composer voice ring (V13)', () => {
  beforeEach(() => {
    session = null;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      font: '',
      measureText: (t: string) => ({ width: t.length * 10 }),
    })) as typeof HTMLCanvasElement.prototype.getContext;
  });

  it('shows no ring when there is no voice session', () => {
    const { container } = renderComposer();
    const cls = panelOf(container).className;

    expect(cls).not.toContain('sendbox-panel--voice-listening');
    expect(cls).not.toContain('sendbox-panel--voice-speaking');
  });

  it.each([
    ['listening', 'listening'],
    ['user-speaking', 'listening'],
    ['speaking', 'speaking'],
  ])('maps session state %s to the %s ring', (state, expected) => {
    session = { isActive: true, state, level: 0.4 };
    const { container } = renderComposer();

    expect(panelOf(container).className).toContain(`sendbox-panel--voice-${expected}`);
  });

  /**
   * The invariant that makes the two rings mean anything. Both applied at once
   * is not a cosmetic bug - the later CSS rule silently wins and the user is
   * shown the wrong state with full confidence.
   */
  it.each(['connecting', 'listening', 'user-speaking', 'transcribing', 'thinking', 'acting', 'speaking', 'error'])(
    'never applies both rings at once, in state %s',
    (state) => {
      session = { isActive: true, state, level: 0.2 };
      const { container } = renderComposer();
      const cls = panelOf(container).className;

      const applied = [
        cls.includes('sendbox-panel--voice-listening'),
        cls.includes('sendbox-panel--voice-speaking'),
      ].filter(Boolean).length;
      expect(applied).toBeLessThanOrEqual(1);
    }
  );

  it('drops the ring entirely while the session is thinking or transcribing', () => {
    // Neither the mic nor the speaker is live, so a ring would be a lie about
    // whether the user is being recorded.
    for (const state of ['thinking', 'transcribing', 'acting', 'connecting']) {
      session = { isActive: true, state, level: 0 };
      const { container, unmount } = renderComposer();
      const cls = panelOf(container).className;

      expect(cls).not.toContain('sendbox-panel--voice-listening');
      expect(cls).not.toContain('sendbox-panel--voice-speaking');
      unmount();
    }
  });

  it('ignores state entirely when the session is not active', () => {
    session = { isActive: false, state: 'listening', level: 0.9 };
    const { container } = renderComposer();

    expect(panelOf(container).className).not.toContain('sendbox-panel--voice-listening');
  });

  /**
   * An inline box-shadow outranks a keyframe. If the component keeps setting
   * one while a ring is up, the animation renders as a single frozen frame and
   * the "it is pulsing" design silently becomes a static border.
   */
  it('leaves box-shadow to the stylesheet while a ring is up', () => {
    session = { isActive: true, state: 'listening', level: 0.5 };
    const { container } = renderComposer();

    expect(panelOf(container).style.boxShadow).toBe('');
  });

  it('still paints the ordinary focus shadow inline when no ring is up', () => {
    const { container } = renderComposer();

    expect(panelOf(container).style.boxShadow).not.toBe('');
  });

  it('feeds the meter from the SESSION level, not the dictation button', () => {
    session = { isActive: true, state: 'user-speaking', level: 0.62 };
    const { getByTestId } = renderComposer();

    expect(getByTestId('composer-voice-level').style.getPropertyValue('--sendbox-voice-level')).toBe('0.62');
  });

  it('clamps a level outside 0-1 instead of overflowing the meter', () => {
    session = { isActive: true, state: 'listening', level: 4.5 };
    const { getByTestId } = renderComposer();

    expect(getByTestId('composer-voice-level').style.getPropertyValue('--sendbox-voice-level')).toBe('1');
  });

  it('shows no meter while speaking - nothing is being recorded', () => {
    session = { isActive: true, state: 'speaking', level: 0.8 };
    const { queryByTestId } = renderComposer();

    expect(queryByTestId('composer-voice-level')).toBeNull();
  });
});

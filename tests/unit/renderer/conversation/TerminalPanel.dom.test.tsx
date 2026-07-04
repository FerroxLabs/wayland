/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #645 Task 6 — TerminalPanel wiring. Renders the panel, asserts it opens a PTY
 * for the chat on mount, streams output into xterm, forwards keystrokes, and
 * closes the PTY on unmount.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  term: {
    loadAddon: vi.fn(),
    open: vi.fn(),
    write: vi.fn(),
    dispose: vi.fn(),
    dataCb: undefined as undefined | ((d: string) => void),
  },
  fitFit: vi.fn(),
  openInvoke: vi.fn().mockResolvedValue({ ok: true }),
  inputInvoke: vi.fn().mockResolvedValue(undefined),
  resizeInvoke: vi.fn().mockResolvedValue(undefined),
  closeInvoke: vi.fn().mockResolvedValue(undefined),
  outputHandler: { current: undefined as undefined | ((p: { terminalId: string; data: string }) => void) },
}));

vi.mock('@xterm/xterm/css/xterm.css', () => ({}));
vi.mock('@xterm/xterm', () => ({
  Terminal: class {
    cols = 80;
    rows = 24;
    loadAddon = h.term.loadAddon;
    open = h.term.open;
    write = h.term.write;
    dispose = h.term.dispose;
    onData = (cb: (d: string) => void) => {
      h.term.dataCb = cb;
      return { dispose: vi.fn() };
    };
  },
}));
vi.mock('@xterm/addon-fit', () => ({
  FitAddon: class {
    fit = h.fitFit;
  },
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock('@/common', () => ({
  ipcBridge: {
    terminal: {
      open: { invoke: h.openInvoke },
      input: { invoke: h.inputInvoke },
      resize: { invoke: h.resizeInvoke },
      close: { invoke: h.closeInvoke },
      output: {
        on: (cb: (p: { terminalId: string; data: string }) => void) => {
          h.outputHandler.current = cb;
          return () => void 0;
        },
      },
      exit: { on: () => () => void 0 },
    },
  },
}));

import TerminalPanel from '@/renderer/pages/conversation/Workspace/components/terminal/TerminalPanel';

beforeEach(() => {
  vi.clearAllMocks();
  h.openInvoke.mockResolvedValue({ ok: true });
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
});
afterEach(() => vi.restoreAllMocks());

describe('TerminalPanel (#645)', () => {
  it('opens a PTY for the chat on mount and mounts xterm', async () => {
    render(<TerminalPanel conversationId='s1' />);
    await Promise.resolve();
    expect(h.term.open).toHaveBeenCalled();
    expect(h.openInvoke).toHaveBeenCalledTimes(1);
    const params = h.openInvoke.mock.calls[0][0];
    expect(params.sessionId).toBe('s1');
    expect(typeof params.terminalId).toBe('string');
  });

  it('streams PTY output into the terminal, filtered by terminalId', async () => {
    render(<TerminalPanel conversationId='s1' />);
    await Promise.resolve();
    const { terminalId } = h.openInvoke.mock.calls[0][0];
    // Output for a different terminal is ignored; ours is written.
    h.outputHandler.current?.({ terminalId: 'other', data: 'nope' });
    h.outputHandler.current?.({ terminalId, data: 'hello' });
    expect(h.term.write).toHaveBeenCalledWith('hello');
    expect(h.term.write).not.toHaveBeenCalledWith('nope');
  });

  it('forwards keystrokes to the PTY', async () => {
    render(<TerminalPanel conversationId='s1' />);
    await Promise.resolve();
    const { terminalId } = h.openInvoke.mock.calls[0][0];
    h.term.dataCb?.('ls\r');
    expect(h.inputInvoke).toHaveBeenCalledWith({ terminalId, data: 'ls\r' });
  });

  it('closes the PTY on unmount', async () => {
    const { unmount } = render(<TerminalPanel conversationId='s1' />);
    await Promise.resolve();
    const { terminalId } = h.openInvoke.mock.calls[0][0];
    unmount();
    expect(h.closeInvoke).toHaveBeenCalledWith({ terminalId });
    expect(h.term.dispose).toHaveBeenCalled();
  });
});

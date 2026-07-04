/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #645 Task 6 — the Terminal tab's content. Mounts an xterm.js terminal, opens
 * the chat's agent PTY via the terminal bridge, and streams both directions.
 * Unmapped agents / missing CLIs surface a friendly in-pane line (no crash).
 */
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import type { TerminalOpenFailure } from '@/common/types/terminal';
import '@xterm/xterm/css/xterm.css';
import { terminalClient } from './terminalClient';

type TerminalPanelProps = {
  conversationId: string;
  cwd?: string;
};

// Monotonic per-mount suffix so each tab gets a distinct PTY id without needing
// crypto in the render path.
let terminalSeq = 0;

const TerminalPanel: React.FC<TerminalPanelProps> = ({ conversationId }) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalIdRef = useRef<string>('');
  if (!terminalIdRef.current) terminalIdRef.current = `term-${conversationId}-${++terminalSeq}`;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const terminalId = terminalIdRef.current;
    // If the tab unmounts before open() resolves, we must still close the PTY
    // that open() is about to spawn — otherwise it lives untracked-by-any-view
    // until app quit and counts against the concurrency cap.
    let disposed = false;

    const term = new Terminal({ convertEol: true, fontSize: 13, cursorBlink: true });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(container);
    try {
      fit.fit();
    } catch {
      /* container not yet sized */
    }

    const writeNotice = (msg: string) => term.write(`\r\n\x1b[33m${msg}\x1b[0m\r\n`);
    const failureMessage = (reason: TerminalOpenFailure): string => {
      const key = {
        disabled: 'conversation.workspace.terminal.disabled',
        unsupported: 'conversation.workspace.terminal.unsupported',
        'missing-cli': 'conversation.workspace.terminal.missingCli',
        'at-capacity': 'conversation.workspace.terminal.atCapacity',
        'not-found': 'conversation.workspace.terminal.notFound',
      }[reason];
      return t(key);
    };

    const disposers: Array<() => void> = [];
    disposers.push(terminalClient.onOutput(terminalId, (data) => term.write(data)));
    disposers.push(terminalClient.onExit(terminalId, () => writeNotice(t('conversation.workspace.terminal.exited'))));
    const inputDisposable = term.onData((data) => {
      void terminalClient.input(terminalId, data);
    });

    void terminalClient
      .open({ terminalId, sessionId: conversationId, cols: term.cols, rows: term.rows })
      .then((res) => {
        // Unmounted mid-open: kill the just-spawned PTY, don't touch the term.
        if (disposed) {
          void terminalClient.close(terminalId);
          return;
        }
        if ('reason' in res) writeNotice(failureMessage(res.reason));
      })
      .catch(() => {
        if (!disposed) writeNotice(failureMessage('not-found'));
      });

    const observer = new ResizeObserver(() => {
      try {
        fit.fit();
        void terminalClient.resize(terminalId, term.cols, term.rows);
      } catch {
        /* mid-teardown */
      }
    });
    observer.observe(container);

    return () => {
      disposed = true;
      observer.disconnect();
      inputDisposable.dispose();
      disposers.forEach((d) => d());
      void terminalClient.close(terminalId);
      term.dispose();
    };
  }, [conversationId, t]);

  return <div ref={containerRef} className='size-full overflow-hidden bg-black' data-testid='terminal-panel' />;
};

export default TerminalPanel;

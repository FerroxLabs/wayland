/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { AgentStartupError } from '@process/acp/errors/AcpError';

// #984 — an ACP agent subprocess writes to stderr exactly when credentials are
// in play (an auth failure echoing the token it just sent, an SDK dumping
// request headers). AgentStartupError concatenated that stderr into its message
// verbatim, and that message is both shown to the user and persisted to the
// daily log file people attach to bug reports.
//
// The scrubber is the SAME one the wcore engine path has always used; #984 only
// moved it somewhere this constructor can reach it.

describe('AgentStartupError stderr redaction (#984)', () => {
  it('redacts high-confidence secret shapes out of the error message', () => {
    const stderr = [
      'auth failed for request',
      'Authorization: Bearer sk-live-ABCDEFGHIJKLMNOP0123456789',
      'api_key = "hunter2-not-a-real-key"',
      'token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVPmB92K27uhbUJU1p1r_wW1gFWFOEjXkg',
    ].join('\n');

    const err = new AgentStartupError('claude-code', 1, null, stderr);

    expect(err.message).not.toContain('sk-live-ABCDEFGHIJKLMNOP0123456789');
    expect(err.message).not.toContain('hunter2-not-a-real-key');
    expect(err.message).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    expect(err.message).toContain('[redacted]');
    // The non-secret diagnostic text still survives, or the redaction destroyed
    // the very thing the stderr summary exists to show.
    expect(err.message).toContain('auth failed for request');
    expect(err.message).toContain('Agent exited before initialize completed (code: 1)');
  });

  it('stores the redacted stderr on the instance, never the raw text', () => {
    const err = new AgentStartupError('gemini', null, 'SIGKILL', 'boom ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ012345');

    expect(err.stderrSummary).not.toContain('ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ012345');
    expect(err.stderrSummary).toContain('[redacted]');
    expect(err.message).toContain('signal: SIGKILL');
  });

  it('leaves ordinary stderr untouched and keeps the empty-stderr shape', () => {
    const plain = new AgentStartupError('codex', 127, null, 'command not found: codex');
    expect(plain.message).toContain('command not found: codex');
    expect(plain.message).not.toContain('[redacted]');

    const empty = new AgentStartupError('codex', 127, null, '');
    expect(empty.stderrSummary).toBe('');
    expect(empty.message).toBe('Agent exited before initialize completed (code: 127)');
  });
});

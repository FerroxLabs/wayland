/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #645 Task 3 — agent → command resolver. Pure, so tests inject the
 * wcore-binary resolver and never touch the filesystem.
 */
import { describe, expect, it } from 'vitest';
import { resolveTerminalCommand } from '@process/terminal/terminalCommand';

const wcoreFound = { resolveWCore: () => '/bundled/wayland-core' };
const wcoreMissing = { resolveWCore: () => null };

describe('resolveTerminalCommand (#645)', () => {
  it('maps wcore to the bundled binary with NO --json-stream, cwd = workspace', () => {
    const spec = resolveTerminalCommand({ type: 'wcore', extra: { workspace: '/proj' } }, wcoreFound);
    expect(spec).toEqual({ command: '/bundled/wayland-core', args: [], cwd: '/proj' });
    expect(spec?.args).not.toContain('--json-stream');
  });

  it('returns null for wcore when the bundled binary is absent', () => {
    expect(resolveTerminalCommand({ type: 'wcore', extra: { workspace: '/proj' } }, wcoreMissing)).toBeNull();
  });

  it('maps codex to the codex CLI', () => {
    expect(resolveTerminalCommand({ type: 'codex', extra: { workspace: '/c' } })).toEqual({
      command: 'codex',
      args: [],
      cwd: '/c',
    });
  });

  it('prefers an explicit cliPath for codex when recorded', () => {
    const spec = resolveTerminalCommand({ type: 'codex', extra: { workspace: '/c', cliPath: '/opt/codex' } });
    expect(spec?.command).toBe('/opt/codex');
  });

  it('maps acp + claude backend to the claude CLI', () => {
    expect(resolveTerminalCommand({ type: 'acp', extra: { backend: 'claude', workspace: '/w' } })).toEqual({
      command: 'claude',
      args: [],
      cwd: '/w',
    });
  });

  it('prefers an explicit cliPath for claude when recorded', () => {
    const spec = resolveTerminalCommand({
      type: 'acp',
      extra: { backend: 'claude', cliPath: '/usr/local/bin/claude' },
    });
    expect(spec?.command).toBe('/usr/local/bin/claude');
  });

  it('returns null for a non-claude ACP backend (no native TUI in v1)', () => {
    expect(resolveTerminalCommand({ type: 'acp', extra: { backend: 'qwen', workspace: '/w' } })).toBeNull();
  });

  it.each(['gemini', 'openclaw-gateway', 'nanobot', 'remote', 'unknown'])(
    'returns null for unmapped agent %s',
    (type) => {
      expect(resolveTerminalCommand({ type, extra: { workspace: '/w' } }, wcoreFound)).toBeNull();
    }
  );
});

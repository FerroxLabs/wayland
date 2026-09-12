/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #645 Task 3 — agent → command resolver. Pure, so tests inject the
 * engine-binary resolver and never touch the filesystem or Electron.
 */
import { describe, expect, it } from 'vitest';
import { resolveTerminalCommand } from '@process/terminal/terminalCommand';

const fuigoFound = { resolveFuigo: () => ({ path: '/bundled/fuigo' }), fuigoHome: () => '/userData/fuigo' };
const fuigoMissing = { resolveFuigo: () => null, fuigoHome: () => '/userData/fuigo' };

describe('resolveTerminalCommand (#645)', () => {
  // Fuigo cutover: the engine's TUI is the bare `fuigo` binary (no subcommand),
  // and it must open the SAME engine home the ACP spawn uses, or the terminal
  // shows an unrelated, empty engine (no memory, no MCP config, no trust).
  it('maps acp + fuigo backend to the bundled fuigo TUI with FUIGO_HOME pinned to the shared home', () => {
    const spec = resolveTerminalCommand({ type: 'acp', extra: { backend: 'fuigo', workspace: '/proj' } }, fuigoFound);
    expect(spec).toEqual({ command: '/bundled/fuigo', args: [], cwd: '/proj', env: { FUIGO_HOME: '/userData/fuigo' } });
  });

  it('returns null for a fuigo chat when the bundled engine is absent', () => {
    expect(
      resolveTerminalCommand({ type: 'acp', extra: { backend: 'fuigo', workspace: '/p' } }, fuigoMissing)
    ).toBeNull();
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

  it('returns null for a third-party ACP backend with no native TUI', () => {
    expect(resolveTerminalCommand({ type: 'acp', extra: { backend: 'qwen', workspace: '/w' } }, fuigoFound)).toBeNull();
  });

  it.each(['gemini', 'openclaw-gateway', 'remote', 'unknown'])('returns null for unmapped agent %s', (type) => {
    expect(resolveTerminalCommand({ type, extra: { workspace: '/w' } }, fuigoFound)).toBeNull();
  });
});

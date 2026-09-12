/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #645 Terminal mode — agent → launch-command resolver (pure, main process).
 *
 * Maps a chat's agent type to the CLI that renders that agent's native terminal
 * UI. Supported:
 *   - The bundled Fuigo engine (`acp` + backend `fuigo`) → the bare `fuigo`
 *     binary on a TTY (no subcommand launches its TUI), with `FUIGO_HOME`
 *     pinned to the same shared engine home the ACP spawn uses, so the TUI
 *     sees the same memory, MCP config and trust grants as the chat.
 *   - Claude Code (`acp` + backend `claude`) → `claude`.
 *   - Codex (`codex`)         → `codex`.
 * Every other agent (gemini / other ACP backends / openclaw-gateway / remote)
 * has no native TUI mapping and resolves to `null` — the caller hides or
 * disables the Terminal tab for those.
 *
 * The function is deliberately pure and existence-agnostic for the external CLIs
 * (`claude`/`codex`): it returns the command to attempt (an explicit `cliPath`
 * when the session recorded one, else the bare command resolved from PATH at
 * spawn). Whether the CLI is actually installed is decided at spawn time so a
 * missing binary surfaces a friendly in-pane message rather than a hidden tab.
 * The bundled engine path IS resolved here (injectable for tests): if no
 * engine binary can be found there is nothing to run, so it returns `null`.
 */
import { resolveFuigoBinary } from '@process/agent/fuigo/runtime';
import { fuigoHomeDir } from '@process/agent/fuigo/launch';

/** Minimal structural view of a conversation the resolver reads. */
export type TerminalSessionInput = {
  type: string;
  extra?: {
    workspace?: string;
    /** ACP backend discriminator (e.g. 'claude', 'qwen', 'codex'). */
    backend?: string;
    /** Explicit CLI path recorded at session creation, when known. */
    cliPath?: string;
  };
};

/** A resolved launch spec for a terminal PTY. */
export type TerminalLaunchSpec = {
  command: string;
  args: string[];
  /** Chat working directory; `undefined` lets the spawner pick a default. */
  cwd?: string;
  /** Extra environment layered over the user's shell env at spawn. */
  env?: Record<string, string>;
};

export type TerminalCommandDeps = {
  /** Injectable for tests; defaults to the verified bundled Fuigo resolver. */
  resolveFuigo?: () => { path: string } | null;
  /** Injectable for tests; defaults to `<userData>/fuigo` (see launch.ts). */
  fuigoHome?: () => string;
};

/** `<userData>/fuigo` - the one engine home every Fuigo spawn shares. Lazily
 *  required so the pure resolver can be imported outside Electron. */
function defaultFuigoHome(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  const { app } = require('electron') as { app: { getPath: (name: string) => string } };
  return fuigoHomeDir(app.getPath('userData'));
}

export function resolveTerminalCommand(
  session: TerminalSessionInput,
  deps: TerminalCommandDeps = {}
): TerminalLaunchSpec | null {
  const resolveFuigo = deps.resolveFuigo ?? resolveFuigoBinary;
  const cwd = session.extra?.workspace;

  // The bare `fuigo` command (no subcommand) is its TUI. FUIGO_HOME must match
  // the ACP spawn's home or the TUI would open an unrelated, empty engine home.
  const fuigoTui = (): TerminalLaunchSpec | null => {
    const resolved = resolveFuigo();
    if (!resolved) return null;
    return { command: resolved.path, args: [], cwd, env: { FUIGO_HOME: (deps.fuigoHome ?? defaultFuigoHome)() } };
  };

  switch (session.type) {
    case 'codex':
      return { command: session.extra?.cliPath || 'codex', args: [], cwd };
    case 'acp':
      if (session.extra?.backend === 'fuigo') return fuigoTui();
      // Of the third-party ACP backends only Claude has a native TUI in v1.
      if (session.extra?.backend === 'claude') {
        return { command: session.extra?.cliPath || 'claude', args: [], cwd };
      }
      return null;
    default:
      return null;
  }
}

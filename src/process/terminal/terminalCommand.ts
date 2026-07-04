/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #645 Terminal mode — agent → launch-command resolver (pure, main process).
 *
 * Maps a chat's agent type to the CLI that renders that agent's native terminal
 * UI. v1 supports exactly the three agents that HAVE a native TUI:
 *   - Wayland Core (`wcore`)  → the bundled `wayland-core` binary on a TTY
 *     (NO `--json-stream`, so it launches its ratatui TUI).
 *   - Claude Code (`acp` + backend `claude`) → `claude`.
 *   - Codex (`codex`)         → `codex`.
 * Every other agent (gemini / other ACP backends / openclaw-gateway / nanobot /
 * remote) has no native TUI mapping and resolves to `null` — the caller hides or
 * disables the Terminal tab for those.
 *
 * The function is deliberately pure and existence-agnostic for the external CLIs
 * (`claude`/`codex`): it returns the command to attempt (an explicit `cliPath`
 * when the session recorded one, else the bare command resolved from PATH at
 * spawn). Whether the CLI is actually installed is decided at spawn time so a
 * missing binary surfaces a friendly in-pane message rather than a hidden tab.
 * The bundled `wayland-core` path IS resolved here (injectable for tests): if the
 * engine binary cannot be found there is nothing to run, so it returns `null`.
 */
import { resolveWCoreBinary } from '@process/agent/wcore/binaryResolver';

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
};

export type TerminalCommandDeps = {
  /** Injectable for tests; defaults to the real bundled-binary resolver. */
  resolveWCore?: () => string | null;
};

export function resolveTerminalCommand(
  session: TerminalSessionInput,
  deps: TerminalCommandDeps = {}
): TerminalLaunchSpec | null {
  const resolveWCore = deps.resolveWCore ?? resolveWCoreBinary;
  const cwd = session.extra?.workspace;

  switch (session.type) {
    case 'wcore': {
      const binary = resolveWCore();
      if (!binary) return null;
      // Native ratatui TUI: launch the binary with NO `--json-stream` flag.
      return { command: binary, args: [], cwd };
    }
    case 'codex':
      return { command: session.extra?.cliPath || 'codex', args: [], cwd };
    case 'acp':
      // Only the Claude ACP backend has a native TUI in v1.
      if (session.extra?.backend === 'claude') {
        return { command: session.extra?.cliPath || 'claude', args: [], cwd };
      }
      return null;
    default:
      return null;
  }
}

/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * The pinned npm catalogue for agent installs.
 *
 * This is a TypeScript constant, not a JSON pin file and not a build script,
 * because the installer needs it at RUNTIME inside the packaged app: the user
 * clicks "install codex" and the main process must already know which package
 * and which exact version to fetch.
 *
 * Versions are EXACT, never ranges. The install argv pins `<pkg>@<version>` so
 * that two users installing on different days get the same bytes, and so the
 * receipt written by `installManifest` records something reproducible.
 *
 * Bumping a version here is a deliberate act: re-check that the new release
 * still resolves to a launch spec (see `launchSpecResolver`) before shipping.
 */

import type { AcpBackendAll } from '@/common/types/acpTypes';

export interface AgentPackage {
  /** npm package name, exactly as published. */
  npmPackage: string;
  /** Exact published version. Never a range, never a dist-tag. */
  version: string;
  /**
   * Command name a USER'S OWN copy would publish on PATH.
   *
   * This is the probe for "a system copy already exists", which is a different
   * fact from "Wayland installed this" — Wayland installs into its own prefix
   * and never puts anything on PATH, so a hit here can only be the user's. The
   * two must stay distinguishable in the data; a detected system copy wins and
   * is never offered an install.
   *
   * Restricted to `[a-zA-Z0-9_.-]` because the detector drops anything else.
   */
  cliCommand: string;
  /**
   * The ACP backend this install can BE, or absent when it cannot be one.
   *
   * Present means: the executable the receipt resolves to is ITSELF an ACP
   * stdio server, so handing its launch spec to the ACP spawn seam (which
   * appends the backend's `acpArgs`) produces a working agent. That is the only
   * condition under which an install may feed `AcpAgentManager`'s `launch`.
   *
   * It is deliberately NOT derived from "the ids happen to match". Verified by
   * running each installed binary's own `--help`:
   *
   *  - kimi   → `kimi acp` — "Run kimi-code as an Agent Client Protocol (ACP)
   *    server over stdio". Its backend's `acpArgs` are `['acp']`, so the spec
   *    plus acpArgs is exactly that command. MAPPED.
   *  - codex  → the installed `@openai/codex` binary has NO `acp` subcommand
   *    (it has `app-server` and `mcp-server`); the ACP server for this backend
   *    is a SEPARATE npm package, `@agentclientprotocol/codex-acp`, which the
   *    `codex` backend's `acpArgs: []` assumes is what gets spawned. Feeding
   *    this receipt into the ACP seam would spawn the interactive TUI with no
   *    arguments and hang the session. NOT MAPPED.
   *  - openclaw → not an ACP backend at all; `openclaw-gateway` is its own
   *    conversation kind with its own process manager. NOT MAPPED.
   *
   * Both unmapped agents still install, still write receipts, and are still
   * uninstallable — they just do not reach the ACP launch seam.
   */
  acpBackend?: AcpBackendAll;
}

/**
 * Agent id → pinned package.
 *
 * Only agents that install cleanly through the `--ignore-scripts` npm channel
 * belong here. Each entry below was installed with the real command
 * (`bun install --cwd <prefix> --ignore-scripts --no-save <pkg>@<version>`)
 * and observed to exit 0 and produce a resolvable launch target.
 */
export const AGENT_PACKAGES: Readonly<Record<string, AgentPackage>> = Object.freeze({
  /** Native per-triple executable, shipped in a platform-specific optional dep. */
  codex: Object.freeze({ npmPackage: '@openai/codex', version: '0.147.0', cliCommand: 'codex' }),
  /** Pure-JS entry (`dist/main.mjs`); launches through the resolved JS runtime. */
  kimi: Object.freeze({
    npmPackage: '@moonshot-ai/kimi-code',
    version: '0.34.0',
    cliCommand: 'kimi',
    acpBackend: 'kimi',
  }),
  /** Pure-JS entry (`openclaw.mjs`); package name confirmed from the repo's own setup skill. */
  openclaw: Object.freeze({ npmPackage: 'openclaw', version: '2026.7.1-2', cliCommand: 'openclaw' }),
});

/** Thrown when an agent id is well-formed but is not in the pinned catalogue. */
export class UnknownAgentError extends Error {
  readonly agentId: string;

  constructor(agentId: string) {
    super(`No pinned npm package for agent "${agentId}"`);
    this.name = 'UnknownAgentError';
    this.agentId = agentId;
  }
}

/** Look up an agent's pinned package, or throw {@link UnknownAgentError}. */
export function getAgentPackage(agentId: string): AgentPackage {
  const entry = Object.prototype.hasOwnProperty.call(AGENT_PACKAGES, agentId) ? AGENT_PACKAGES[agentId] : undefined;
  if (!entry) throw new UnknownAgentError(agentId);
  return entry;
}

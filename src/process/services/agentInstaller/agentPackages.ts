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

export interface AgentPackage {
  /** npm package name, exactly as published. */
  npmPackage: string;
  /** Exact published version. Never a range, never a dist-tag. */
  version: string;
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
  codex: Object.freeze({ npmPackage: '@openai/codex', version: '0.147.0' }),
  /** Pure-JS entry (`dist/main.mjs`); launches through the resolved JS runtime. */
  kimi: Object.freeze({ npmPackage: '@moonshot-ai/kimi-code', version: '0.34.0' }),
  /** Pure-JS entry (`openclaw.mjs`); package name confirmed from the repo's own setup skill. */
  openclaw: Object.freeze({ npmPackage: 'openclaw', version: '2026.7.1-2' }),
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

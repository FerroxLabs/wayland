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
   * Command name a USER'S OWN copy of THIS package would publish on PATH.
   *
   * This is the probe for "a system copy already exists", which is a different
   * fact from "Wayland installed this" — Wayland installs into its own prefix
   * and never puts anything on PATH, so a hit here can only be the user's. The
   * two must stay distinguishable in the data; a detected system copy wins and
   * is never offered an install.
   *
   * IT MUST BE A BIN THE PINNED PACKAGE ITSELF PUBLISHES, not merely a command
   * associated with the agent. A hit removes the Install button outright and
   * makes the card read "Uses your system copy", so probing for a neighbouring
   * binary that cannot serve `acpBackend` claims a working setup the ACP seam
   * cannot use AND hides the pinned, offline-capable install from exactly the
   * users most likely to want it. Pinned by a live case in
   * `tests/live/agentInstallLaunch.live.test.ts`, which drives a real ACP
   * `initialize` into whatever this names when it is found on PATH.
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
   *  - codex  → MAPPED, but only after the PACKAGE was corrected. The
   *    `@openai/codex` binary has NO `acp` subcommand (it has `app-server` and
   *    `mcp-server`), so the earlier pin could never reach this seam. The ACP
   *    server for this backend is `@agentclientprotocol/codex-acp`, which is
   *    what the `codex` backend's `acpArgs: []` has always assumed gets spawned.
   *    Driven for real over stdio before mapping it:
   *
   *      -> {"jsonrpc":"2.0","id":0,"method":"initialize","params":{...}}
   *      <- {"jsonrpc":"2.0","id":0,"result":{"protocolVersion":1,
   *         "agentInfo":{"name":"@agentclientprotocol/codex-acp",
   *         "title":"Codex","version":"1.1.2"},"agentCapabilities":{...},
   *         "authMethods":[{"id":"api-key",...},{"id":"chat-gpt",...}]}}
   *
   *    and then `session/new`, which returned a real sessionId and the model
   *    list. Verified under BOTH the bundled Bun and node v22.
   *
   * An unmapped agent still installs, still writes a receipt, and is still
   * uninstallable — it just does not reach the ACP launch seam.
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
  /**
   * The ACP BRIDGE, not the CLI. `@openai/codex` on its own has no `acp`
   * subcommand and could never reach the ACP seam, so pinning it produced an
   * install that wrote a receipt and launched nothing.
   *
   * The bridge is a pure-JS entry (`dist/index.js`) and depends on
   * `@openai/codex`, so the native codex binary still lands in the same prefix
   * and `installedAgentLaunch` names it absolutely via `CODEX_PATH`. Only ONE
   * version is pinned, and it is the one the receipt records: a second pin for
   * the CLI would let the receipt claim a version the user did not get, since
   * the bridge's own dependency range decides what actually lands.
   *
   * `cliCommand` is `codex-acp`, the bin this package publishes
   * (`bin: { "codex-acp": "dist/index.js" }`), NOT `codex`. Probing for `codex`
   * matched the ordinary Codex CLI, which has no `acp` subcommand and cannot
   * serve this backend — so every machine with Codex installed was told
   * "Uses your system copy" and offered no install of the bridge that would
   * actually work.
   */
  codex: Object.freeze({
    npmPackage: '@agentclientprotocol/codex-acp',
    version: '1.1.2',
    cliCommand: 'codex-acp',
    acpBackend: 'codex',
  }),
  /** Pure-JS entry (`dist/main.mjs`); launches through the resolved JS runtime. */
  kimi: Object.freeze({
    npmPackage: '@moonshot-ai/kimi-code',
    version: '0.34.0',
    cliCommand: 'kimi',
    acpBackend: 'kimi',
  }),
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

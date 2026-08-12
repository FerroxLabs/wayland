/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Where a managed agent's npm install lands.
 *
 * One directory per agent under the app's userData root:
 *   <userData>/agents/<agentId>
 *
 * The agent id becomes a path segment, so it is validated against a closed
 * alphabet BEFORE it is joined. `path.join` happily resolves `..`, so an
 * unchecked id ("../../Library/LaunchAgents") would escape userData entirely
 * and hand an installer/uninstaller a path outside the app's own data.
 * Validation therefore runs first, before any filesystem call.
 */

import path from 'node:path';

import { getPlatformServices } from '@/common/platform';

/**
 * Agent ids are directory names. Lowercase alphanumerics and hyphens only:
 * no dots (blocks `.`/`..`), no separators, no colon (blocks NTFS alternate
 * data streams), no whitespace.
 */
export const AGENT_ID_PATTERN = /^[a-z0-9-]+$/;

/** Thrown when an agent id could escape, or otherwise abuse, the install root. */
export class InvalidAgentIdError extends Error {
  readonly agentId: unknown;

  constructor(agentId: unknown) {
    super(`Invalid agent id ${JSON.stringify(agentId)}: must match ${AGENT_ID_PATTERN.source}`);
    this.name = 'InvalidAgentIdError';
    this.agentId = agentId;
  }
}

/** Throw {@link InvalidAgentIdError} unless `agentId` is a safe path segment. */
export function assertValidAgentId(agentId: string): void {
  if (typeof agentId !== 'string' || !AGENT_ID_PATTERN.test(agentId)) {
    throw new InvalidAgentIdError(agentId);
  }
}

/**
 * Resolve the install prefix for an agent.
 *
 * @param userDataDir Override for the userData root. Production leaves this
 *   unset and reads the real one from the platform services (the same source
 *   `app.getPath('userData')` feeds); tests pass a temp dir so they never touch
 *   the user's profile.
 */
export function resolveAgentInstallPrefix(agentId: string, userDataDir?: string): string {
  assertValidAgentId(agentId);
  return path.join(resolveAgentInstallRoot(userDataDir), agentId);
}

/**
 * The directory every managed agent is installed under.
 *
 * Exported because the concierge diagnostics subprocess needs the ROOT to
 * enumerate installs, and it cannot compute it: it has no Electron, so
 * `getPlatformServices()` there falls back to `~/.wayland-server` and would
 * answer confidently and wrongly. The path is therefore injected as an env var
 * from the main process, and it has to come from HERE rather than being joined
 * a second time at the call site, or the two spellings drift and the diagnostic
 * reports "never installed" for agents that are installed.
 */
export function resolveAgentInstallRoot(userDataDir?: string): string {
  const root = userDataDir ?? getPlatformServices().paths.getDataDir();
  return path.join(root, 'agents');
}

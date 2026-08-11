/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * The PRODUCER side of {@link AcpLaunchSpec}.
 *
 * The consumer side was already complete before this module existed: an
 * `AcpLaunchSpec` travels `AcpAgentManagerData.launch` → `agentConfig.launch` →
 * `AcpAgentV2` → `LegacyConnectorFactory` → `createGenericSpawnConfig`, where it
 * wins over `cliPath` and bypasses `parseWindowsCliPath` entirely. What did not
 * exist was anything that ever SET it. Installs wrote a receipt that nothing
 * read, so a genuinely successful install stayed inert: the card said "Installed
 * by Wayland" and the agent was still not launchable.
 *
 * This module reads the receipt back.
 *
 * PRECEDENCE (decision D1) IS NOT DECIDED HERE.
 * --------------------------------------------
 * A detected SYSTEM copy wins over a Wayland install — never break a working
 * setup. That decision is made ONCE, in `AgentRegistry.merge()`, by the existing
 * `deduplicate()` first-wins-by-backend rule: PATH-detected builtins are merged
 * ahead of the managed entries this module produces, so a managed entry only
 * survives when nothing was found on PATH. This module reports what is
 * installed; it does not rank it.
 *
 * ONLY SOME CATALOGUED AGENTS CAN REACH THE ACP SEAM.
 * ---------------------------------------------------
 * "The agent id matches a backend id" is not evidence that the installed
 * executable speaks ACP. `AgentPackage.acpBackend` records the verified fact and
 * is the only thing consulted here; see the field's own comment for what was run
 * to establish it, and for why `codex` and `openclaw` are deliberately absent.
 */

import type { AcpBackendAll, AcpLaunchSpec } from '@/common/types/acpTypes';
import { ACP_BACKENDS_ALL, isAcpLaunchSpec } from '@/common/types/acpTypes';

import { AGENT_PACKAGES, getAgentPackage } from './agentPackages';
import { getAgentInstallStatus } from './installAgent';
import { AGENT_ID_PATTERN } from './installPrefix';

/** One installed agent that can serve an ACP backend. */
export interface ManagedAcpAgent {
  agentId: string;
  backend: AcpBackendAll;
  /** Display name, taken from the backend catalogue so the picker matches. */
  name: string;
  /** The backend's ACP arguments, appended to the spec at spawn time. */
  acpArgs?: string[];
  launch: AcpLaunchSpec;
}

/**
 * The launch spec recorded for an agent Wayland installed, or null.
 *
 * Null covers every not-usable case identically — never installed, a prefix
 * left behind by a run that died before the receipt, a package removed from
 * under a valid receipt, a launch target deleted — because they all mean the
 * same thing to a caller: there is nothing here to spawn.
 *
 * Re-validated with `isAcpLaunchSpec` even though `readInstallReceipt` already
 * did: the receipt is a file the user can edit, and the cost of checking twice
 * is nothing next to spawning `undefined` as an executable.
 */
export function resolveManagedAgentLaunch(agentId: string, userDataDir?: string): AcpLaunchSpec | null {
  if (typeof agentId !== 'string' || !AGENT_ID_PATTERN.test(agentId)) return null;
  if (!Object.prototype.hasOwnProperty.call(AGENT_PACKAGES, agentId)) return null;

  let status: ReturnType<typeof getAgentInstallStatus>;
  try {
    status = getAgentInstallStatus(agentId, userDataDir);
  } catch {
    // getAgentInstallStatus touches the filesystem; an unreadable profile must
    // read as "nothing installed", not take down the launch path.
    return null;
  }
  if (!status.installed || !status.receipt) return null;
  return isAcpLaunchSpec(status.receipt.launchSpec) ? status.receipt.launchSpec : null;
}

/** The ACP backend a catalogued agent can serve, or null when it cannot serve one. */
export function acpBackendForManagedAgent(agentId: string): AcpBackendAll | null {
  if (!Object.prototype.hasOwnProperty.call(AGENT_PACKAGES, agentId)) return null;
  return getAgentPackage(agentId).acpBackend ?? null;
}

/**
 * Every catalogued agent that is installed AND can serve an ACP backend, in
 * catalogue order so the merged agent list does not reshuffle between reads.
 */
export function listManagedAcpAgents(userDataDir?: string): ManagedAcpAgent[] {
  const out: ManagedAcpAgent[] = [];
  for (const agentId of Object.keys(AGENT_PACKAGES)) {
    const backend = acpBackendForManagedAgent(agentId);
    if (!backend) continue;
    const launch = resolveManagedAgentLaunch(agentId, userDataDir);
    if (!launch) continue;
    const backendConfig = ACP_BACKENDS_ALL[backend];
    out.push({
      agentId,
      backend,
      name: backendConfig?.name ?? agentId,
      ...(backendConfig?.acpArgs ? { acpArgs: backendConfig.acpArgs } : {}),
      launch,
    });
  }
  return out;
}

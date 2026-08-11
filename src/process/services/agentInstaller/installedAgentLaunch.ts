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
 * ONLY A CATALOGUED AGENT WITH A VERIFIED acpBackend REACHES THE ACP SEAM.
 * -----------------------------------------------------------------------
 * "The agent id matches a backend id" is not evidence that the installed
 * executable speaks ACP. `AgentPackage.acpBackend` records the verified fact and
 * is the only thing consulted here; see the field's own comment for the actual
 * handshakes that were driven to establish it.
 */

import type { AcpBackendAll, AcpLaunchSpec } from '@/common/types/acpTypes';
import { ACP_BACKENDS_ALL, isAcpLaunchSpec } from '@/common/types/acpTypes';

import { AGENT_PACKAGES, getAgentPackage } from './agentPackages';
import { getAgentInstallStatus } from './installAgent';
import { AGENT_ID_PATTERN } from './installPrefix';
import { resolveNativeExecutable } from './launchSpecResolver';

/**
 * The package that ships the native `codex` binary. It arrives as a dependency
 * of the pinned ACP bridge, into the SAME prefix, which is why it can be named
 * absolutely without a second catalogue entry.
 */
const CODEX_NATIVE_PACKAGE = '@openai/codex';

/**
 * Env a catalogued agent's launch spec needs beyond what the runtime itself
 * requires. Computed at READ time rather than baked into the receipt, so an
 * install performed before this existed gets it too.
 *
 * `codex` is the only entry: the pinned package is the ACP bridge
 * (`@agentclientprotocol/codex-acp`), which drives a native codex binary. The
 * bridge reads `CODEX_PATH` in its own `startAcpServer()`, and pointing it at
 * the absolute binary in Wayland's prefix is what makes the install
 * self-contained. Without it the bridge resolves codex for itself, which is a
 * behaviour we do not control and cannot pin.
 *
 * An absent binary yields no key at all rather than an empty or guessed value:
 * the bridge's own fallback is strictly better than `CODEX_PATH=""`.
 */
function managedLaunchEnv(agentId: string, prefix: string): Record<string, string> {
  if (agentId !== 'codex') return {};
  const codexBinary = resolveNativeExecutable({
    prefix,
    npmPackage: CODEX_NATIVE_PACKAGE,
    binName: 'codex',
    platform: process.platform,
    arch: process.arch,
  });
  return codexBinary ? { CODEX_PATH: codexBinary } : {};
}

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
  const spec = status.receipt.launchSpec;
  if (!isAcpLaunchSpec(spec)) return null;

  // Stamped HERE, at the one place a spec is read back out of a receipt, so
  // "this came from a Wayland install" is a fact about how the spec was
  // obtained rather than a claim carried in a file the user can edit.
  const extraEnv = managedLaunchEnv(agentId, status.prefix);
  const env = { ...spec.env, ...extraEnv };
  return {
    ...spec,
    ...(Object.keys(env).length > 0 ? { env } : {}),
    origin: 'wayland-install',
  };
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

/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The "Available to install" data model.
 *
 * The shipped Agents page renders DETECTED agents only, so an agent the user
 * does not have simply does not exist anywhere in the product. This module is
 * the missing half: it merges the pinned catalogue (which every build knows
 * about) with what the main process observed (PATH probe, receipt, disk) and
 * with what THIS session is doing right now (an install in flight, an install
 * that failed), and answers with ONE explicit state per agent.
 *
 * It is deliberately a pure function over data, not a hook and not a component:
 * decision D1 ("a detected system copy wins, and is never offered an install")
 * has to be checkable in one place, and a precedence rule buried in JSX is not
 * checkable at all.
 */

import { ACP_BACKENDS_ALL, type AcpBackendAll } from '@/common/types/acpTypes';
import type {
  AgentInstallFailureReason,
  AgentInstallerReport,
  ManagedAgentStatus,
} from '@/common/types/agentInstaller';

/**
 * How one catalogued agent should be presented.
 *
 * Three of these are facts from the main process (`system`, `installed`,
 * `absent`), one is a property of the build (`unavailable`), and two are
 * session-local (`installing`, `failed`). They are collapsed into a single
 * value here so a card renders one branch instead of re-deriving precedence
 * from four booleans.
 */
export type InstallableAgentState = 'system' | 'installed' | 'absent' | 'installing' | 'failed' | 'unavailable';

/** What this session is doing to an agent. Absent when nothing is happening. */
export type InstallActivity = { phase: 'installing' } | { phase: 'failed'; reason: AgentInstallFailureReason };

/** Session-local activity, keyed by agent id. */
export type InstallActivityMap = Readonly<Record<string, InstallActivity | undefined>>;

/** One row of the "Available to install" band. */
export type InstallableAgent = {
  agentId: string;
  /** Brand name. Never translated — see {@link resolveInstallableAgentName}. */
  name: string;
  npmPackage: string;
  /** Version an install would fetch right now (the catalogue pin). */
  pinnedVersion: string;
  /** Where an install would write. Named in the consent sheet (D2). */
  installPrefix: string;
  state: InstallableAgentState;
  /**
   * Version to show in the chip, from Wayland's own receipt. Null when Wayland
   * has not installed this agent — including on a `system` card, where the
   * user's own copy is in charge and its version is not a fact we hold.
   */
  installedVersion: string | null;
  /** Named cause behind a `failed` state; null in every other state. */
  failureReason: AgentInstallFailureReason | null;
};

/**
 * Brand names for the catalogued agents.
 *
 * Agent names are proper nouns and are never translated (the rest of the page
 * renders `agent.name` straight off the detector for the same reason). `codex`
 * and `kimi` are read from the ACP registry so the two cannot drift; `openclaw`
 * is not an ACP backend and has no registry entry, so it carries a literal.
 */
const FALLBACK_AGENT_NAMES: Readonly<Record<string, string>> = Object.freeze({
  openclaw: 'OpenClaw',
});

/** Resolve an agent's display name, preferring the ACP registry. */
export function resolveInstallableAgentName(agentId: string): string {
  return ACP_BACKENDS_ALL[agentId as AcpBackendAll]?.name ?? FALLBACK_AGENT_NAMES[agentId] ?? agentId;
}

/**
 * Collapse one agent's observations into the state its card renders.
 *
 * Precedence, in order, and each step is load-bearing:
 *
 *  1. `system` — decision D1 is unconditional. A detected system copy wins over
 *     everything, including a Wayland install and including whatever this
 *     session thinks it is doing. Installing over a working setup is how you
 *     break one, so this cannot sit below a session-local flag.
 *  2. `installing` / `failed` — session-local truth about an operation the
 *     main process has not finished reporting yet. Without these the card would
 *     read `absent` for the whole install and then blink to `installed`.
 *  3. `installed` — a receipt in Wayland's prefix whose payload is still on disk.
 *  4. `unavailable` — nothing is installable at all on a build with no bundled
 *     runtime, so an absent agent must say so rather than offer a button that
 *     is guaranteed to fail. Deliberately below `installed`: an agent that was
 *     already installed keeps working on such a build.
 *  5. `absent`.
 */
export function resolveInstallableState(
  status: ManagedAgentStatus,
  bundledBunAvailable: boolean,
  activity: InstallActivity | undefined
): InstallableAgentState {
  if (status.state === 'system') return 'system';
  if (activity?.phase === 'installing') return 'installing';
  if (activity?.phase === 'failed') return 'failed';
  if (status.state === 'installed') return 'installed';
  if (!bundledBunAvailable) return 'unavailable';
  return 'absent';
}

/**
 * Whether an install may be STARTED for this state.
 *
 * Used both to decide whether to render an Install button and, at execution
 * time, to refuse a consent that has gone stale — so D1 holds even if the
 * status changes between opening the consent sheet and confirming it.
 */
export function isInstallable(state: InstallableAgentState): boolean {
  return state === 'absent' || state === 'failed';
}

/** Merge the main-process report with this session's activity, in catalogue order. */
export function buildInstallableAgents(
  report: AgentInstallerReport | undefined,
  activity: InstallActivityMap
): InstallableAgent[] {
  if (!report) return [];
  return report.agents.map((status) => {
    const own = activity[status.agentId];
    const state = resolveInstallableState(status, report.bundledBunAvailable, own);
    return {
      agentId: status.agentId,
      name: resolveInstallableAgentName(status.agentId),
      npmPackage: status.npmPackage,
      pinnedVersion: status.pinnedVersion,
      installPrefix: status.installPrefix,
      state,
      // Reported straight off the receipt, INDEPENDENTLY of `state`: a machine
      // with both a system copy and a Wayland install still says both, so the
      // `system` card can show what Wayland put there without claiming it is
      // the version of the copy actually in use.
      installedVersion: status.managedInstall?.version ?? null,
      failureReason: state === 'failed' && own?.phase === 'failed' ? own.reason : null,
    };
  });
}

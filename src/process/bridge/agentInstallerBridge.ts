/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Agent Installer Bridge
 *
 * Exposes the main-process agent installer (already built and proven in
 * `@process/services/agentInstaller`) to the renderer over the IPC bridge. This
 * file is a SEAM, not an implementation: it does no installing of its own, it
 * maps the service's results onto the wire types and turns the service's named
 * errors into typed refusals so the renderer never sees a raw stack.
 *
 * THE THREE-WAY DISTINCTION IS COMPUTED HERE, IN THE DATA.
 * -------------------------------------------------------
 * "Wayland installed it" and "the user already has it" are DIFFERENT facts with
 * different evidence: a receipt in Wayland's own prefix versus a hit on the
 * system PATH. Wayland installs into `<userData>/agents/<id>` and never puts
 * anything on PATH, so the two can never be confused for each other — but only
 * if both are observed. A detected system copy WINS (decision D1): it is
 * reported as `system` and the UI never offers to install over a working setup.
 */

import { ipcBridge } from '@/common';
import type {
  AgentInstallCancelResult,
  AgentInstallResult,
  AgentInstallerReport,
  AgentUninstallResult,
  ManagedAgentStatus,
} from '@/common/types/agentInstaller';
import { acpDetector } from '@process/agent/acp/AcpDetector';
import { agentRegistry } from '@process/agent/AgentRegistry';
import { AGENT_PACKAGES, UnknownAgentError, getAgentPackage } from '@process/services/agentInstaller/agentPackages';
import {
  AgentInstallCancelledError,
  AgentInstallInProgressError,
  AgentInstallTimeoutError,
  BundledBunUnavailableError,
  InstallCommandFailedError,
  PackageNotInstalledError,
  cancelAgentInstall,
  getAgentInstallStatus,
  installAgent,
  isAgentInstallInFlight,
  resolveBundledBunPath,
} from '@process/services/agentInstaller/installAgent';
import { LaunchSpecUnresolvedError } from '@process/services/agentInstaller/launchSpecResolver';
import { uninstallAgent } from '@process/services/agentInstaller/installManifest';
import { InvalidAgentIdError } from '@process/services/agentInstaller/installPrefix';

/** Catalogue order, fixed so the settings band does not reshuffle between reads. */
function catalogueIds(): string[] {
  return Object.keys(AGENT_PACKAGES);
}

/**
 * Which catalogued agents have a copy on the system PATH. Never throws: a
 * detector failure must degrade to "no system copy found", which at worst offers
 * an install the user did not need — not to a broken settings page.
 */
async function detectSystemCopies(): Promise<Set<string>> {
  const commands = catalogueIds().map((id) => getAgentPackage(id).cliCommand);
  try {
    return await acpDetector.batchCheckCliAvailability(commands);
  } catch {
    return new Set<string>();
  }
}

/**
 * Fold the receipt-backed install status and the PATH probe into one entry.
 *
 * `detectedOnPath` and `managedInstall` are BOTH reported raw. `state` is the
 * precedence decision (D1) applied once, in main, where it is testable — not a
 * hint the view has to re-derive.
 */
function buildAgentStatus(agentId: string, detected: ReadonlySet<string>): ManagedAgentStatus {
  const pkg = getAgentPackage(agentId);
  const install = getAgentInstallStatus(agentId);
  const detectedOnPath = detected.has(pkg.cliCommand);

  const managedInstall =
    install.installed && install.receipt
      ? {
          prefix: install.receipt.prefix,
          version: install.receipt.version,
          installedAt: install.receipt.installedAt,
        }
      : null;

  // D1: a detected system copy wins outright, even over a valid Wayland install,
  // so the card reads "your system copy" and offers no competing Install button.
  const state = detectedOnPath ? 'system' : managedInstall ? 'installed' : 'absent';

  return {
    agentId,
    npmPackage: pkg.npmPackage,
    pinnedVersion: pkg.version,
    // The destination the consent sheet has to name (D2). Taken from the
    // service's own resolver rather than rebuilt here, and reported even when
    // nothing is installed — which is precisely when consent is asked for.
    installPrefix: install.prefix,
    state,
    detectedOnPath,
    managedInstall,
    reason: install.reason,
    // Read from the main-process guard, not inferred: this is the fact a
    // component re-mount destroys and the reason the second-install bug exists.
    installing: isAgentInstallInFlight(agentId),
  };
}

/**
 * Re-read managed installs into the agent registry.
 *
 * An install that nothing re-detects is still invisible until the next full
 * detection pass, so the user installs an agent and it does not appear. Never
 * throws: a refresh failure must not turn a successful install into an error.
 */
async function refreshDetection(): Promise<void> {
  try {
    await agentRegistry.refreshManagedAgents();
  } catch (err) {
    console.warn('[agentInstallerBridge] Failed to refresh managed agents:', err);
  }
}

/** Handler: the full install/detection picture for every catalogued agent. */
export async function handleAgentInstallerStatus(): Promise<AgentInstallerReport> {
  const detected = await detectSystemCopies();
  return {
    // Every install runs through the bundled bun, so no bun means nothing on
    // this build is installable at all (win32-arm64, non-AVX2 win32-x64).
    bundledBunAvailable: resolveBundledBunPath() !== null,
    agents: catalogueIds().map((id) => buildAgentStatus(id, detected)),
  };
}

/** True for a well-formed `{ agentId }` payload off the wire. */
function readAgentId(params: unknown): string | null {
  if (typeof params !== 'object' || params === null) return null;
  const agentId = (params as { agentId?: unknown }).agentId;
  return typeof agentId === 'string' && agentId.length > 0 ? agentId : null;
}

/** Re-read one agent's status after a mutation, so the caller never guesses. */
async function statusFor(agentId: string): Promise<ManagedAgentStatus> {
  return buildAgentStatus(agentId, await detectSystemCopies());
}

/**
 * Handler: install one catalogued agent.
 *
 * The service owns the whole operation (pinned version, `--ignore-scripts`, own
 * prefix, receipt). This maps its named errors onto typed refusals: an unknown
 * or malformed id, a build with no bundled bun, and a genuine install failure
 * are three different things to the user and must not collapse into one banner.
 */
export async function handleInstallAgent(params: unknown): Promise<AgentInstallResult> {
  const agentId = readAgentId(params);
  if (agentId === null) return { ok: false, reason: 'unknown-agent' };

  try {
    // Reject ids that are not in the catalogue before touching the filesystem.
    // The service validates too; this refuses at the seam, where the id arrives.
    getAgentPackage(agentId);
    await installAgent(agentId);
    // The receipt exists now; make the picker see it before answering, so the
    // renderer's post-install revalidate and the agent list agree.
    await refreshDetection();
    return { ok: true, status: await statusFor(agentId) };
  } catch (err) {
    if (err instanceof UnknownAgentError || err instanceof InvalidAgentIdError) {
      return { ok: false, reason: 'unknown-agent', message: err.message };
    }
    if (err instanceof BundledBunUnavailableError) {
      return { ok: false, reason: 'bundled-bun-unavailable', message: err.message };
    }
    // An install already running is not a failure of this request's inputs, and
    // a cancel is not a failure at all. Both are their own reasons so the card
    // can say what actually happened instead of offering a misleading Retry.
    if (err instanceof AgentInstallInProgressError) {
      return { ok: false, reason: 'already-installing', message: err.message };
    }
    if (err instanceof AgentInstallTimeoutError) {
      return { ok: false, reason: 'timed-out', message: err.message };
    }
    if (err instanceof AgentInstallCancelledError) {
      return { ok: false, reason: 'cancelled', message: err.message };
    }
    if (
      err instanceof InstallCommandFailedError ||
      err instanceof PackageNotInstalledError ||
      err instanceof LaunchSpecUnresolvedError
    ) {
      return { ok: false, reason: 'install-failed', message: err.message };
    }
    return { ok: false, reason: 'error', message: String(err) };
  }
}

/**
 * Handler: remove an install Wayland performed.
 *
 * Uninstall goes BY RECEIPT: with no receipt nothing is removed and the caller
 * is told why (`removed: false`, `reason: 'receipt-missing'`) — that is a
 * successful, correct no-op, not a failure. It is deliberately still callable
 * when `state` is `system`: the receipt names only Wayland's own prefix, so a
 * user's system copy can never be the thing that gets deleted.
 */
export async function handleUninstallAgent(params: unknown): Promise<AgentUninstallResult> {
  const agentId = readAgentId(params);
  if (agentId === null) return { ok: false, reason: 'unknown-agent' };

  try {
    // Reject ids that are not in the catalogue before touching the filesystem.
    getAgentPackage(agentId);
    const report = uninstallAgent(agentId);
    // The receipt is gone; drop the managed entry from detection so the picker
    // stops offering an agent whose files no longer exist.
    await refreshDetection();
    return {
      ok: true,
      removed: report.removed,
      ...(report.reason ? { reason: report.reason } : {}),
      status: await statusFor(agentId),
    };
  } catch (err) {
    if (err instanceof UnknownAgentError || err instanceof InvalidAgentIdError) {
      return { ok: false, reason: 'unknown-agent', message: err.message };
    }
    return { ok: false, reason: 'error', message: String(err) };
  }
}

/**
 * Handler: stop an install that is running.
 *
 * `cancelled: false` is the honest answer when nothing was running — the
 * install may have completed in the gap between the click and this call, and
 * reporting that as an error would make a correct outcome look broken. The
 * in-flight `installAgent` promise rejects with AgentInstallCancelledError,
 * which `handleInstallAgent` maps to `reason: 'cancelled'` for whoever is still
 * awaiting it.
 */
export async function handleCancelAgentInstall(params: unknown): Promise<AgentInstallCancelResult> {
  const agentId = readAgentId(params);
  if (agentId === null) return { ok: false, reason: 'unknown-agent' };

  try {
    getAgentPackage(agentId);
    const cancelled = cancelAgentInstall(agentId);
    return { ok: true, cancelled, status: await statusFor(agentId) };
  } catch (err) {
    if (err instanceof UnknownAgentError || err instanceof InvalidAgentIdError) {
      return { ok: false, reason: 'unknown-agent', message: err.message };
    }
    return { ok: false, reason: 'error', message: String(err) };
  }
}

/** Register the agent-installer IPC providers (status + install + uninstall + cancel). */
export function initAgentInstallerBridge(): void {
  ipcBridge.agentInstaller.status.provider(handleAgentInstallerStatus);
  ipcBridge.agentInstaller.install.provider(handleInstallAgent);
  ipcBridge.agentInstaller.uninstall.provider(handleUninstallAgent);
  ipcBridge.agentInstaller.cancel.provider(handleCancelAgentInstall);
}

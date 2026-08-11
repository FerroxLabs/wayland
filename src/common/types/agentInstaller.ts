/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Renderer-facing types for managed agent installs. These cross the IPC bridge,
 * so they live in common (no Node APIs). The process-internal types
 * (AgentInstallReceipt, AgentPackage, InstallSpawn) stay under
 * src/process/services/agentInstaller/.
 *
 * WHAT THE WIRE DELIBERATELY OMITS
 * --------------------------------
 * The install receipt records the resolved {@link AcpLaunchSpec} — an absolute
 * executable path plus, in a dev build, `ELECTRON_RUN_AS_NODE=1`. Nothing in the
 * UI needs it (the renderer never spawns; the main process reads the receipt
 * directly when it launches the agent) and `agent-installer:status` stays
 * reachable by a paired remote WebUI, so the launch spec does not cross this
 * seam. The prefix does, because the consent copy has to name the destination.
 */

import type { AgentInstallStatusReason } from '@/process/services/agentInstaller/installAgent';

export type { AgentInstallStatusReason };

/**
 * How an agent is present, as a FACT rather than a rendering decision.
 *
 *  - `system`    — a copy of the agent's CLI is on the user's PATH. A detected
 *                  system copy WINS: it is never offered an install, because
 *                  installing over a working setup is how you break one.
 *  - `installed` — Wayland installed it: a valid receipt in Wayland's own prefix,
 *                  with the package and the launch target still on disk.
 *  - `absent`    — neither.
 *
 * The three are computed in the main process from three independent observations
 * (PATH probe, receipt, disk) and travel as data. A view that re-derived them
 * from a single boolean could not tell `system` from `installed`, which is the
 * whole distinction the card copy turns on.
 */
export type AgentAvailabilityState = 'system' | 'installed' | 'absent';

/** Receipt-backed detail of an install Wayland performed itself. */
export type ManagedInstallDetail = {
  /** Absolute install prefix — the destination named in the consent copy. */
  prefix: string;
  /** Version actually installed, from the receipt. May lag the pinned version. */
  version: string;
  /** ISO-8601 timestamp from the receipt. */
  installedAt: string;
};

/** Everything the UI needs about one catalogued agent. */
export type ManagedAgentStatus = {
  agentId: string;
  npmPackage: string;
  /** Version an install would fetch right now, from the pinned catalogue. */
  pinnedVersion: string;
  /**
   * Absolute path an install WOULD write to — `<userData>/agents/<agentId>`.
   *
   * Always present, unlike {@link ManagedInstallDetail.prefix}, which only
   * exists once something has actually been installed. Decision D2 requires the
   * consent sheet to name the destination BEFORE the install runs, i.e. exactly
   * when there is no receipt to read it from, so the destination has to travel
   * independently of whether an install has happened.
   */
  installPrefix: string;
  state: AgentAvailabilityState;
  /**
   * A copy of this agent's CLI was found on the system PATH. Reported RAW and
   * independently of `state`, so a machine that has both a system copy and a
   * Wayland install still says so.
   */
  detectedOnPath: boolean;
  /**
   * Present whenever Wayland's own install is valid — including when `state` is
   * `system`, because the system copy winning does not delete Wayland's receipt.
   */
  managedInstall: ManagedInstallDetail | null;
  /** Why the managed install is not usable; `ok` when it is. */
  reason: AgentInstallStatusReason;
};

/** Result of an `agent-installer:status` request. */
export type AgentInstallerReport = {
  /**
   * False on builds that ship no bundled bun (win32-arm64, and non-AVX2
   * win32-x64). Every install goes through bun, so nothing is installable at
   * all on those targets and the UI must say so rather than offer a button that
   * always fails.
   */
  bundledBunAvailable: boolean;
  /** One entry per catalogued agent, in catalogue order. */
  agents: ManagedAgentStatus[];
};

/** Why an install could not be performed. */
export type AgentInstallFailureReason = 'unknown-agent' | 'bundled-bun-unavailable' | 'install-failed' | 'error';

/** Result of an `agent-installer:install` request. */
export type AgentInstallResult =
  | { ok: true; status: ManagedAgentStatus }
  | { ok: false; reason: AgentInstallFailureReason; message?: string };

/** Result of an `agent-installer:uninstall` request. */
export type AgentUninstallResult =
  | {
      ok: true;
      /** False when there was no receipt — nothing was removed, by design. */
      removed: boolean;
      /** Why nothing was removed. Absent when `removed` is true. */
      reason?: 'receipt-missing';
      status: ManagedAgentStatus;
    }
  | { ok: false; reason: 'unknown-agent' | 'error'; message?: string };

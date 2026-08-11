/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Install orchestration for the "Available to install" band.
 *
 * CONSENT GATES EXECUTION, IT DOES NOT MERELY PRECEDE IT (decision D2).
 *
 * There is deliberately NO exported function that takes an agent id and
 * installs it. The only way to reach `agent-installer:install` is:
 *
 *     requestInstall(agent)   →   mints the pending consent (opens the sheet)
 *     confirmInstall()        →   executes the pending consent, or nothing
 *
 * `confirmInstall` takes no arguments. With no pending consent there is nothing
 * to execute and it returns without touching IPC, so a caller that skips the
 * sheet has no id to smuggle in. `requestInstall` refuses to mint consent for
 * an agent that is not installable, and `confirmInstall` re-checks that against
 * the LIVE status before spawning anything — a consent minted while an agent
 * looked absent must not survive the discovery that it is really a system copy
 * (D1). Both refusals are load-bearing and both are pinned by tests.
 */

import React from 'react';
import type { KeyedMutator } from 'swr';
import { ipcBridge } from '@/common';
import type { AgentInstallerReport } from '@/common/types/agentInstaller';
import { isInstallable, type InstallActivity, type InstallableAgent } from './installableAgents';

/** The four facts decision D2 requires the consent sheet to state. */
export type InstallConsent = {
  agentId: string;
  /** Brand name, for the sheet title. Not one of the four facts. */
  name: string;
  npmPackage: string;
  /** The pinned version, not a range — what this install will fetch. */
  version: string;
  /** Absolute destination inside Wayland's own profile. */
  destination: string;
};

export type AgentInstallerController = {
  /** Session-local install activity, keyed by agent id. */
  activity: Readonly<Record<string, InstallActivity | undefined>>;
  /** The consent awaiting confirmation, or null when the sheet is closed. */
  pendingConsent: InstallConsent | null;
  /** Ask for consent. Never installs. */
  requestInstall: (agent: InstallableAgent) => void;
  /**
   * Close the consent sheet without installing. Named for what it does: it
   * withdraws a REQUEST. It used to be called `cancelInstall`, which read as
   * "stop the running install" and is the one thing it cannot do.
   */
  dismissConsent: () => void;
  /** Execute the pending consent, if there is one. The ONLY path to install. */
  confirmInstall: () => Promise<void>;
  /** Stop an install that is RUNNING, in the main process. */
  cancelInstall: (agentId: string) => Promise<void>;
  /** Remove an install Wayland performed. Never touches a system copy. */
  uninstall: (agentId: string) => Promise<void>;
};

/**
 * @param agents The live merged list — read at CONFIRM time so a stale consent
 *   is re-validated against current status rather than the status that was on
 *   screen when the sheet opened.
 * @param revalidate SWR mutator for the status query, run after an install so
 *   the band reflects the receipt instead of guessing.
 */
export function useAgentInstaller(
  agents: InstallableAgent[],
  revalidate: KeyedMutator<AgentInstallerReport | undefined>
): AgentInstallerController {
  const [activity, setActivity] = React.useState<Record<string, InstallActivity | undefined>>({});
  const [pendingConsent, setPendingConsent] = React.useState<InstallConsent | null>(null);

  // Read inside the async confirm handler so it sees the list as it is when the
  // user confirms, not the render that produced the callback.
  const agentsRef = React.useRef(agents);
  agentsRef.current = agents;

  const requestInstall = React.useCallback((agent: InstallableAgent) => {
    // A `system`, `installed`, `installing` or `unavailable` agent is never
    // offered an install, so consent for one can only come from a bug or from a
    // caller reaching past the UI. Refuse to mint it.
    if (!isInstallable(agent.state)) return;
    setPendingConsent({
      agentId: agent.agentId,
      name: agent.name,
      npmPackage: agent.npmPackage,
      version: agent.pinnedVersion,
      destination: agent.installPrefix,
    });
  }, []);

  const dismissConsent = React.useCallback(() => setPendingConsent(null), []);

  /**
   * Kill a RUNNING install. Deliberately does not write the activity map: the
   * `confirmInstall` call still awaiting `install.invoke` settles with the main
   * process's own `{ ok: false, reason: 'cancelled' }`, and that is the outcome
   * the card should show. Writing `cancelled` here as well would race it.
   *
   * A rejected invoke is swallowed for the same reason it is elsewhere: the
   * install may simply have finished between the click and the call. The status
   * re-read below reports whatever actually happened.
   */
  const cancelInstall = React.useCallback(
    async (agentId: string) => {
      try {
        await ipcBridge.agentInstaller.cancel.invoke({ agentId });
      } catch (err) {
        void err;
      }
      await revalidate();
    },
    [revalidate]
  );

  /**
   * Remove an install Wayland performed. The main process refuses without a
   * receipt, which is what keeps a detected SYSTEM copy safe (D1) even if a
   * caller reached past the UI; the UI declines to offer it as well.
   *
   * THE OUTCOME IS REPORTED, exactly as the install path reports its own. This
   * used to discard the result and swallow the rejection, so a user who clicked
   * Remove and confirmed a DESTRUCTIVE modal got no signal at all in either of
   * the two ways it can not happen: a refusal (`ok: false`) and main's honest
   * no-op (`removed: false`, nothing was there to remove). Both land in the same
   * `failed` activity slot the install path already uses.
   */
  const uninstall = React.useCallback(
    async (agentId: string) => {
      try {
        const result = await ipcBridge.agentInstaller.uninstall.invoke({ agentId });
        let next: InstallActivity | undefined;
        if (result.ok === false) next = { phase: 'failed', reason: 'remove-failed' };
        else if (!result.removed) next = { phase: 'failed', reason: 'receipt-missing' };
        // A real removal clears the slot rather than writing a success marker,
        // so the re-read below is the only source of truth for what is left.
        setActivity((prev) => ({ ...prev, [agentId]: next }));
      } catch (err) {
        // A rejected invoke is a broken bridge, not a remove outcome — and it is
        // the case that used to vanish silently.
        setActivity((prev) => ({ ...prev, [agentId]: { phase: 'failed', reason: 'remove-failed' } }));
        void err;
      }
      await revalidate();
    },
    [revalidate]
  );

  const confirmInstall = React.useCallback(async () => {
    const consent = pendingConsent;
    // THE GATE. No pending consent means the sheet was never passed through,
    // and there is no id to install even if a caller wanted one.
    if (!consent) return;

    // Re-check against live status: the sheet may have been open while the
    // status query discovered a system copy (D1) or a finished install.
    const live = agentsRef.current.find((a) => a.agentId === consent.agentId);
    if (!live || !isInstallable(live.state)) {
      setPendingConsent(null);
      return;
    }

    setPendingConsent(null);
    setActivity((prev) => ({ ...prev, [consent.agentId]: { phase: 'installing' } }));
    try {
      const result = await ipcBridge.agentInstaller.install.invoke({ agentId: consent.agentId });
      // Success clears the entry entirely so the merged state falls back to the
      // receipt the main process just wrote, rather than keeping a second
      // source of truth that could disagree with it.
      let next: InstallActivity | undefined;
      if (result.ok === false) next = { phase: 'failed', reason: result.reason };
      setActivity((prev) => ({ ...prev, [consent.agentId]: next }));
    } catch (err) {
      // A rejected invoke is a broken bridge, not an install outcome. Surface it
      // as a failure with a Retry rather than leaving the card spinning forever.
      setActivity((prev) => ({ ...prev, [consent.agentId]: { phase: 'failed', reason: 'error' } }));
      void err;
    }
    await revalidate();
  }, [pendingConsent, revalidate]);

  return { activity, pendingConsent, requestInstall, dismissConsent, confirmInstall, cancelInstall, uninstall };
}

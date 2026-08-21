/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The live-session registry the boundary axis revokes through.
 *
 * WHY THIS EXISTS. Removing a folder from Settings must not be a file edit
 * that only takes effect at the next launch. Core's grants are session-scoped
 * and held in the engine's memory, so an entry deleted from the durable list
 * while a session is running would leave that session STILL READING the folder
 * for as long as it lives - a revoke the user watched succeed and that did
 * nothing. `revoke_path` is the only thing that actually withdraws it, and it
 * has to be sent to every engine already holding the grant.
 *
 * WHY A REGISTRY AND NOT A LOOKUP. The agent that owns `revoke_path` is a
 * private field of its manager, and there is no public path from a workspace
 * to it. Rather than reach through that encapsulation, each agent PUBLISHES a
 * two-field capability here for its lifetime: the workspace it runs in, and a
 * bound `revokePath`. Nothing else about the agent is exposed, and the module
 * imports nothing from the agent, so there is no cycle.
 *
 * The stored `workspace` is the agent's spawn cwd verbatim. Matching is the
 * caller's business (see `revokeFolderGrantInLiveSessions`), because only the
 * caller knows which workspace id resolved to which folder.
 */

/** What a live engine session offers the boundary axis. Nothing more. */
export type LivePathGrantSession = Readonly<{
  /** The engine's spawn cwd, verbatim. */
  workspace: string;
  /**
   * Withdraw one grant by its host-chosen id. Idempotent engine-side, and
   * never throws: a dead transport resolves `null` on the receipt timeout.
   */
  revokePath: (grantId: string) => Promise<unknown>;
}>;

const liveSessions = new Set<LivePathGrantSession>();

/**
 * Publish a session for the lifetime of its agent. Returns the withdrawal
 * handle; the agent calls it exactly once, when it is killed.
 */
export function registerLivePathGrantSession(session: LivePathGrantSession): () => void {
  liveSessions.add(session);
  return () => {
    liveSessions.delete(session);
  };
}

/** Every session published right now. A snapshot, so a caller may await inside a loop. */
export function listLivePathGrantSessions(): readonly LivePathGrantSession[] {
  return [...liveSessions];
}

/** Test-only: drop every registration so one suite cannot leak into the next. */
export function clearLivePathGrantSessionsForTest(): void {
  liveSessions.clear();
}

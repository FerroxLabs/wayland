/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Whether the set of agent configs holding a connector is still UNKNOWN.
 *
 * The detail panel used to render an empty list as a positive claim - "Not
 * synced to any agent yet" - while the primary button was simultaneously
 * reporting "Adding MCP configuration to 6 agents...". Empty is only the truth
 * once the answer is known: not while an install is running, not while the
 * agent configs are being re-read, and not before the persisted status has been
 * loaded back. In any of those states the panel has to say it is still looking.
 */
export function agentPublicationIsUnknown(state: {
  installing: boolean;
  statusLoaded: boolean;
  serverLoading: boolean;
}): boolean {
  return state.installing || !state.statusLoaded || state.serverLoading;
}

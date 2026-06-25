/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

export type FluxFailoverTurn = { input: string; files: string[] };

export type FluxFailoverDeps = {
  conversationId: string;
  /** The failed turn to replay after reconnect, or null if none was captured. */
  pendingTurn: FluxFailoverTurn | null;
  /** Runs the Flux one-click connect. Resolves { ok } (mirror of connectFlux). */
  connectFlux: () => Promise<{ ok: boolean }>;
  /** Switch the conversation to flux-auto (ACP: setModel re-spawn). Resolves true on success. */
  switchToFlux: (conversationId: string) => Promise<boolean>;
  /** Re-run the failed turn. */
  replay: (turn: FluxFailoverTurn) => void;
  /** Clear the remedy card. Called ONLY on full success. */
  clearCard: () => void;
  /**
   * Surface a failure to the user. Called when Flux connected but the model
   * switch failed (the surprising case). Connect failures are left silent: the
   * connect flow owns its own UI and the card stays up as implicit feedback.
   */
  onError?: (stage: 'switch') => void;
};

/** Conversations with an in-flight failover, to drop a double-click while one runs. */
const inFlight = new Set<string>();

/**
 * Orchestrate the disconnected-chat -> Flux failover:
 *   connectFlux -> switch model to flux-auto -> replay failed turn -> clear card.
 *
 * The card is cleared ONLY after the full chain succeeds, so a switch failure
 * leaves the remedy card up (with an error toast) rather than stranding the user
 * on a dead chat with no affordance. Replay fires only after the model switch
 * resolves; the send path itself awaits the re-spawned agent's init, so the
 * replayed turn cannot be dropped. Re-entrant calls for the same conversation
 * are dropped while one is in flight.
 *
 * Returns true when the full chain (connect + switch [+ replay] + clear) succeeded.
 */
export async function routeThroughFluxAndReplay(deps: FluxFailoverDeps): Promise<boolean> {
  if (inFlight.has(deps.conversationId)) return false;
  inFlight.add(deps.conversationId);
  try {
    const res = await deps.connectFlux();
    if (!res.ok) return false; // connect flow surfaced its own state; keep the card up

    const switched = await deps.switchToFlux(deps.conversationId);
    if (!switched) {
      deps.onError?.('switch');
      return false; // keep the card up so the user can retry / add a key
    }

    if (deps.pendingTurn) deps.replay(deps.pendingTurn);
    deps.clearCard();
    return true;
  } finally {
    inFlight.delete(deps.conversationId);
  }
}

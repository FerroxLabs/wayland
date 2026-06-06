/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ipcBridge } from '@/common';
import type {
  KickoffResult,
  KickoffSuggestion,
  KickoffTelemetryEvent,
} from '@process/services/kickoff/types';

/**
 * Hook for the new-chat Kickoff card. Consumes the SuggestionEngine's
 * per-assistant suggestion through the kickoff IPC namespace.
 *
 * Behavior:
 *  - On `assistantId` change, fetches a fresh suggestion. If the user
 *    already × dismissed this assistant in the current session, no fetch
 *    runs (per-session in-memory dismiss state, no Settings, no
 *    persistence - see Sean's locked decision #1).
 *  - `accept()` returns the prefill string the input should drop in, fires
 *    `accepted` telemetry, and the caller (KickoffCard via GuidPage)
 *    pipes it into `guidInput.setInput`. Returning the string instead of
 *    side-effecting keeps the hook decoupled from any input store.
 *  - `redirect()` advances through up to 2 alternates, then falls through
 *    to dismiss (the "Something else" ladder cap from handoff §6.8).
 *  - `dismissByInteraction()` is the × button. `dismissByTyping()` is the
 *    silent dismiss the renderer fires when the user starts typing in the
 *    input - same state change, distinct telemetry so v2 analytics can
 *    distinguish "user said no" from "user did not engage with the card."
 */

// v0.4.7.1 (D-M-1) - Module-scoped intentionally so the dismiss decision
// survives unmount/remount of the GuidPage within one session. NOTE: this
// Set resets in development on every Vite HMR module reload; production
// builds keep it for the lifetime of the renderer process. The behavior
// gap only matters during dev iteration on this file.
const dismissedAssistantsThisSession = new Set<string>();

function isSuggestion(result: KickoffResult): result is KickoffSuggestion {
  return (result as KickoffSuggestion).cascadeLevel !== undefined;
}

export type UseKickoffReturn = {
  visible: boolean;
  currentText: string | undefined;
  /** Returns the prefill string the input should drop in (or undefined if no suggestion). */
  accept: () => string | undefined;
  redirect: () => void;
  dismissByInteraction: () => void;
  dismissByTyping: () => void;
};

export function useKickoff(assistantId: string | undefined): UseKickoffReturn {
  const [suggestion, setSuggestion] = useState<KickoffSuggestion | null>(null);
  const [alternateIndex, setAlternateIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const lastFetchedFor = useRef<string | undefined>(undefined);
  // v0.4.7.1 (RENDERER-2) - Lock to prevent double-fire on rapid double-click
  // of the primary Accept button (and symmetric on Redirect / dismiss). The
  // lock auto-clears on the next render via a layout-equivalent effect so a
  // throw inside the handler can't permanently lock the card.
  const inFlightRef = useRef(false);

  // Reset card state + (re-)fetch when assistantId changes.
  useEffect(() => {
    if (!assistantId) {
      setSuggestion(null);
      setDismissed(false);
      setAlternateIndex(0);
      return;
    }
    // Per-session dismiss survives unmount/remount of the GuidPage but not a
    // restart. The Set lives at module scope intentionally for that reason.
    if (dismissedAssistantsThisSession.has(assistantId)) {
      setSuggestion(null);
      setDismissed(true);
      setAlternateIndex(0);
      return;
    }
    setDismissed(false);
    setAlternateIndex(0);
    lastFetchedFor.current = assistantId;
    let cancelled = false;
    void ipcBridge.kickoff.suggest
      .invoke({ assistantId })
      .then((result) => {
        if (cancelled || lastFetchedFor.current !== assistantId) return;
        if (isSuggestion(result)) {
          setSuggestion(result);
        } else {
          setSuggestion(null);
          // v0.4.7.1 (D-M-5) - `kickoffs-excluded` is an intentional opt-out
          // (agent-profile assistants per DATA-2). Don't pollute v2 analytics
          // with these - they aren't a cascade miss, they're a design choice.
          if (result.notRendered !== 'kickoffs-excluded') {
            void fireTelemetry({ event: 'not_rendered', notRenderedReason: result.notRendered });
          }
        }
      })
      .catch((err) => {
        console.warn('[useKickoff] suggest IPC failed', err);
        if (cancelled) return;
        setSuggestion(null);
        // v0.4.7.1 (D-M-5) - Fire telemetry with the new 'ipc-error' reason so
        // v2 analytics can surface IPC failures separately from engine misses.
        void fireTelemetry({ event: 'not_rendered', notRenderedReason: 'ipc-error' });
      });
    return () => {
      cancelled = true;
    };
  }, [assistantId]);

  const accept = useCallback((): string | undefined => {
    if (!suggestion) return undefined;
    // v0.4.7.1 (D-M-2) - Bail if the assistantId changed mid-flight (rapid
    // assistant switch). The stale closure could otherwise fire telemetry
    // tagged to the previous assistant's kickoffId.
    if (assistantId !== lastFetchedFor.current) return undefined;
    // v0.4.7.1 (RENDERER-2) - Single-shot lock against double-tap.
    if (inFlightRef.current) return undefined;
    inFlightRef.current = true;
    const isPrimary = alternateIndex === 0;
    const alternate = !isPrimary ? suggestion.alternates[alternateIndex - 1] : undefined;
    if (!isPrimary && !alternate) {
      inFlightRef.current = false;
      return undefined;
    }
    const acceptedId = isPrimary ? suggestion.kickoffId : alternate!.kickoffId;
    const prefill = isPrimary ? suggestion.prefill : alternate!.prefill;
    void fireTelemetry({
      event: 'accepted',
      kickoffId: acceptedId,
      cascadeLevel: suggestion.cascadeLevel,
    });
    // Mark dismissed once accepted - the card visually clears once
    // `dismissed=true` flips below. The caller (GuidPage) is responsible
    // for focusing the textarea after dropping in the prefill; with the
    // RENDERER-1 fix that focus actually lands.
    if (assistantId) dismissedAssistantsThisSession.add(assistantId);
    setDismissed(true);
    return prefill;
  }, [alternateIndex, assistantId, suggestion]);

  const redirect = useCallback(() => {
    if (!suggestion) return;
    if (assistantId !== lastFetchedFor.current) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    // v0.4.7.1 (D-L-4) - Defense-in-depth: skip alternates with empty text
    // even if engine-side validation in `vendoredAssistantOverlay` somehow
    // lets a malformed entry through. Find the next non-empty alternate
    // ahead of the current index; if none, fall through to dismiss.
    let next = alternateIndex + 1;
    const maxIndex = suggestion.alternates.length;
    while (next - 1 < maxIndex) {
      const candidate = suggestion.alternates[next - 1];
      if (candidate && candidate.text && candidate.text.trim().length > 0) break;
      next += 1;
    }
    if (next - 1 >= maxIndex) {
      // Ladder exhausted - fall through to bare input.
      if (assistantId) dismissedAssistantsThisSession.add(assistantId);
      setDismissed(true);
      inFlightRef.current = false;
      return;
    }
    void fireTelemetry({
      event: 'redirected',
      kickoffId: suggestion.kickoffId,
      cascadeLevel: suggestion.cascadeLevel,
    });
    setAlternateIndex(next);
    inFlightRef.current = false;
  }, [alternateIndex, assistantId, suggestion]);

  const dismissByInteraction = useCallback(() => {
    if (assistantId !== lastFetchedFor.current) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (suggestion) {
      void fireTelemetry({
        event: 'dismissed',
        kickoffId: suggestion.kickoffId,
        cascadeLevel: suggestion.cascadeLevel,
        // v0.4.7.1 (D-M-3) - Distinguish the × click from a typing dismiss.
        dismissReason: 'interaction',
      });
    }
    if (assistantId) dismissedAssistantsThisSession.add(assistantId);
    setDismissed(true);
  }, [assistantId, suggestion]);

  const dismissByTyping = useCallback(() => {
    if (assistantId !== lastFetchedFor.current) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    // Telemetry kept distinct from the explicit × so v2 analytics can show
    // "card shown but user just started typing" vs "card actively rejected."
    if (suggestion) {
      void fireTelemetry({
        event: 'dismissed',
        kickoffId: suggestion.kickoffId,
        cascadeLevel: suggestion.cascadeLevel,
        // v0.4.7.1 (D-M-3) - Distinguish typing-past from explicit × click.
        dismissReason: 'typing',
      });
    }
    if (assistantId) dismissedAssistantsThisSession.add(assistantId);
    setDismissed(true);
  }, [assistantId, suggestion]);

  // v0.4.7.1 (RENDERER-2) - Auto-clear the in-flight lock once the
  // suggestion/index/dismissed state has settled so a future render can
  // accept new input. Without this, a thrown handler would leave the card
  // permanently locked.
  useEffect(() => {
    inFlightRef.current = false;
  }, [suggestion, alternateIndex, dismissed, assistantId]);

  const visible = !dismissed && suggestion !== null;
  const currentText =
    alternateIndex === 0 ? suggestion?.text : suggestion?.alternates[alternateIndex - 1]?.text;

  return { visible, currentText, accept, redirect, dismissByInteraction, dismissByTyping };
}

function fireTelemetry(event: KickoffTelemetryEvent): Promise<void> {
  return ipcBridge.kickoff.telemetry.invoke(event).catch((err) => {
    console.warn('[useKickoff] telemetry IPC failed', err);
  });
}

/** Test-only - clear the module-scoped per-session dismiss set. */
export function __resetKickoffSessionDismissForTests(): void {
  dismissedAssistantsThisSession.clear();
}

/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { FLUX_MODEL_DISPLAY, type FluxModelId } from '@/common/config/flux';
import type { AcpModelInfo } from '@/common/types/acpTypes';

/**
 * Resolve the model info to display after a refresh, honoring the user's pinned
 * selection. Background refreshes (the claude 1.5s poll, model-info reloads, and
 * stream updates) report the agent's CURRENT model, which after a turn is its
 * DEFAULT, not the model the user picked in this chat. Without a pin they
 * silently revert the user's selection back to Default (#136 / #146 / #149).
 *
 * A Flux tier is pinned whenever Flux is showable (the agent never reports it,
 * since it rides the spawn env). Otherwise, once the user has switched models
 * in-chat, the native selection is pinned as long as it is still offered.
 */
export function resolvePinnedModelInfo(
  next: AcpModelInfo,
  pins: {
    fluxModelId: FluxModelId | null;
    showFlux: boolean;
    userChangedModel: boolean;
    selectedModelId: string | null;
    backend?: string;
  }
): AcpModelInfo {
  if (pins.fluxModelId && pins.showFlux) {
    return { ...next, currentModelId: pins.fluxModelId, currentModelLabel: FLUX_MODEL_DISPLAY[pins.fluxModelId] };
  }
  const sel = pins.selectedModelId;
  if (pins.userChangedModel && sel) {
    // The Claude picker emits registry ids ("claude-opus-4-8") while the agent
    // advertises slot ids ("opus"/"sonnet"/"haiku"). An exact-only match leaves
    // the native pin dead for Claude, so the display falls through to the agent's
    // reported model on every 1.5s poll - Flux for a flux-routed teammate, i.e.
    // the pick visibly reverts to Flux Fast (#207). Match the pick to an
    // available slot (Claude only, to avoid false matches on other ACP backends)
    // and pin THAT slot's id + friendly label so the selection holds.
    const match = next.availableModels.find(
      (m) => m.id === sel || (pins.backend === 'claude' && sel.toLowerCase().includes(m.id.toLowerCase()))
    );
    if (match) {
      if (next.currentModelId !== match.id) {
        return { ...next, currentModelId: match.id, currentModelLabel: match.label || match.id };
      }
      return next;
    }
    // No advertised row matches the pick. Claude always advertises its slots, so a
    // no-match here is a non-claude ACP backend (codex, qwen, …) whose background
    // acp_model_info / poll reports the agent's DEFAULT, not the user's pick —
    // dropping to `next` there silently reverts the selection (the codex pick
    // vanishes). Hold the pick as currentModelId so it survives the event. Claude
    // keeps its existing behavior, and the backend-less path (no `backend`, e.g. a
    // solo cold-start before a backend is known) also stays unchanged so a truly
    // no-longer-offered selection still falls through to the agent value. This
    // never coerces onto a look-alike row (e.g. gpt-5-codex -> gpt-5); it holds
    // the exact id the user chose.
    if (pins.backend && pins.backend !== 'claude' && next.currentModelId !== sel) {
      return { ...next, currentModelId: sel, currentModelLabel: sel };
    }
  }
  return next;
}

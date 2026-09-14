/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { FLUX_DEFAULT_MODEL, isFluxModelId } from './flux';

/** Prefix of the entries Desktop writes into Fuigo's managed config for the user's own providers. */
export const FUIGO_BYOK_MODEL_PREFIX = 'byok/';

export type FuigoNewChatModelInputs = {
  /** `acp.config.fuigo.preferredModelId`: the model the user last picked in the new-chat picker. */
  pickedModelId?: string;
  /** `fuigo.defaultModel.useModel`: the default set at onboarding, by Concierge, or carried over from Core. */
  savedDefaultModel?: string;
  /** The assistant's own `models` list; its first entry is the assistant's model. */
  assistantModels?: readonly string[];
  /** Whether the Flux Router provider is connected. */
  fluxConnected: boolean;
  /** Model ids the engine last advertised (`acp.cachedModels.fuigo.availableModels`); empty when never seen. */
  advertisedModelIds: readonly string[];
};

/**
 * The model a NEW Fuigo chat is created on, or undefined when nothing can run.
 *
 * With no model, Fuigo picks its own default (`flux-auto`), which completed the
 * agentic brief 1 time in 6 against `flux-reasoning`'s 8 in 8. In order:
 *   1. the user's explicit choice for Fuigo - the new-chat pick, then the saved default;
 *   2. the assistant's configured model;
 *   3. `FLUX_DEFAULT_MODEL` when Flux is connected;
 *   4. the first of the user's own (BYOK) models the engine advertises.
 *
 * The engine's cached `currentModelId` is deliberately NOT a step: it records
 * whatever Fuigo defaulted to on the first session ever, never a choice.
 *
 * A saved default or an assistant model can name a raw provider model
 * (`gemini-3.7-flash`, from the onboarding pin) that Fuigo only serves as
 * `byok/<provider>/<model>`, so those are mapped onto the advertised catalog and
 * skipped when it has no such entry. A Flux tier is only usable with Flux connected.
 */
export function resolveFuigoNewChatModel(inputs: FuigoNewChatModelInputs): string | undefined {
  const advertised = inputs.advertisedModelIds;
  const usable = (id: string | undefined, trustUnknownCatalog: boolean): string | undefined => {
    const trimmed = id?.trim();
    if (!trimmed) return undefined;
    if (isFluxModelId(trimmed)) return inputs.fluxConnected ? trimmed : undefined;
    if (advertised.includes(trimmed)) return trimmed;
    const byok = advertised.find((m) => m.startsWith(FUIGO_BYOK_MODEL_PREFIX) && m.endsWith(`/${trimmed}`));
    if (byok) return byok;
    // The new-chat picker only offers ids it was given; with no catalog seen yet, trust it.
    return trustUnknownCatalog && advertised.length === 0 ? trimmed : undefined;
  };

  return (
    usable(inputs.pickedModelId, true) ??
    usable(inputs.savedDefaultModel, false) ??
    usable(inputs.assistantModels?.[0], false) ??
    (inputs.fluxConnected ? FLUX_DEFAULT_MODEL : undefined) ??
    advertised.find((m) => m.startsWith(FUIGO_BYOK_MODEL_PREFIX))
  );
}

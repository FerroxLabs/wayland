/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The model a new Fuigo chat is created on. A Smart Trader chat on 0.13.0 ran
 * on Flux Auto because the new-chat page named no model and read the engine's
 * cached default (`flux-auto`) as if it were a choice. Flux Reasoning finished
 * the agentic brief 8/8, Flux Auto 1/6.
 */
import { describe, expect, it } from 'vitest';
import { FLUX_DEFAULT_MODEL } from '@/common/config/flux';
import { resolveFuigoNewChatModel, type FuigoNewChatModelInputs } from '@/common/config/fuigoNewChatModel';

const CATALOG = ['flux-auto', 'flux-reasoning', 'byok/openai/gpt-4o', 'byok/google-gemini/gemini-3.7-flash'];
const base: FuigoNewChatModelInputs = { fluxConnected: true, advertisedModelIds: CATALOG };
const resolve = (over: Partial<FuigoNewChatModelInputs>) => resolveFuigoNewChatModel({ ...base, ...over });

describe('resolveFuigoNewChatModel - order', () => {
  it('1a. the new-chat pick wins over everything, flux-auto included when the user chose it', () => {
    expect(
      resolve({
        pickedModelId: 'flux-auto',
        savedDefaultModel: 'flux-reasoning',
        assistantModels: ['byok/openai/gpt-4o'],
      })
    ).toBe('flux-auto');
  });

  it('1b. the saved Fuigo default is next, ahead of the assistant model', () => {
    expect(resolve({ savedDefaultModel: 'byok/openai/gpt-4o', assistantModels: ['flux-reasoning'] })).toBe(
      'byok/openai/gpt-4o'
    );
  });

  it('2. the assistant model is next, ahead of the Flux default', () => {
    expect(resolve({ assistantModels: ['byok/openai/gpt-4o', 'flux-auto'] })).toBe('byok/openai/gpt-4o');
  });

  it('3. with nothing chosen and Flux connected, Flux Reasoning - never Flux Auto', () => {
    expect(resolve({})).toBe(FLUX_DEFAULT_MODEL);
    expect(FLUX_DEFAULT_MODEL).toBe('flux-reasoning');
  });

  it('4. with nothing chosen and no Flux, the first BYOK model the engine advertises', () => {
    expect(resolve({ fluxConnected: false })).toBe('byok/openai/gpt-4o');
  });

  it('5. nothing usable at all leaves the model unset', () => {
    expect(resolve({ fluxConnected: false, advertisedModelIds: ['flux-auto'] })).toBeUndefined();
    expect(resolve({ fluxConnected: false, advertisedModelIds: [] })).toBeUndefined();
  });
});

describe('resolveFuigoNewChatModel - only ids the engine can run', () => {
  it("maps the onboarding pin's raw provider model onto its advertised byok entry", () => {
    expect(resolve({ savedDefaultModel: 'gemini-3.7-flash' })).toBe('byok/google-gemini/gemini-3.7-flash');
  });

  it('skips a saved default Fuigo does not serve and falls through', () => {
    expect(resolve({ savedDefaultModel: 'allam-2-7b' })).toBe(FLUX_DEFAULT_MODEL);
    // Not even when the catalog is unknown: a raw provider id would fail the session.
    expect(resolve({ savedDefaultModel: 'allam-2-7b', advertisedModelIds: [] })).toBe(FLUX_DEFAULT_MODEL);
  });

  it('skips a Flux tier once Flux is disconnected', () => {
    expect(resolve({ fluxConnected: false, pickedModelId: 'flux-reasoning' })).toBe('byok/openai/gpt-4o');
    expect(resolve({ fluxConnected: false, savedDefaultModel: 'flux-reasoning' })).toBe('byok/openai/gpt-4o');
  });

  it('trusts a picker id before any catalog was seen, but not once the catalog lacks it', () => {
    expect(resolve({ pickedModelId: 'gpt-5.6-sol', advertisedModelIds: [] })).toBe('gpt-5.6-sol');
    expect(resolve({ pickedModelId: 'byok/gone/old-model' })).toBe(FLUX_DEFAULT_MODEL);
  });
});

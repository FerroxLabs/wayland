/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Which provider a Wayland Nano chat has been DIRECTED at (#1039).
 *
 * Nano is the one backend that routes across providers, and Desktop hands it
 * credentials through the shared per-provider env vars
 * (`buildConnectedProviderEnv`). Handing it every connected key meant Nano's own
 * internal priority chose who paid: a user who connected an Anthropic key for
 * Claude Code had Nano spend it without choosing Anthropic for Nano, and with
 * no way to see or change that before the first turn.
 *
 * The user's direction is the chat's selected model. Nano advertises and echoes
 * non-Flux models as `<provider>:<model>` colon ids (C8 Q2), so the prefix names
 * the provider unambiguously - no catalog lookup, no guessing. Flux ids are bare
 * and carry no provider: Nano owns the live Flux catalog and receives the Flux
 * key as a FILE, never as a provider env var, so they resolve to "no third-party
 * provider directed".
 *
 * Pure: no I/O, no secrets.
 */

import { NANO_KNOWN_PROVIDER_IDS } from './providersPayload';

const KNOWN_ID_SET: ReadonlySet<string> = new Set(NANO_KNOWN_PROVIDER_IDS);

/**
 * The provider id a Nano spawn may spend, or `undefined` when the chat names
 * none.
 *
 * `undefined` is returned for: no selected model, a bare (non-namespaced) id, a
 * Flux id, and any prefix that is not a provider Nano can actually route. The
 * caller treats `undefined` as "inject no third-party provider key", which is
 * the safe direction - a Nano chat with no credential says so, where the old
 * behaviour billed a key the user never pointed at it.
 */
export function wnanoDirectedProviderId(selectedModelId: string | undefined | null): string | undefined {
  if (typeof selectedModelId !== 'string') return undefined;
  const separator = selectedModelId.indexOf(':');
  if (separator <= 0) return undefined;
  const providerId = selectedModelId.slice(0, separator);
  // A model id AFTER the prefix is required: `anthropic:` names no model, and a
  // provider with no model is not a direction to spend on.
  if (selectedModelId.length <= separator + 1) return undefined;
  if (!KNOWN_ID_SET.has(providerId)) return undefined;
  // flux-router never authenticates through a provider env var (the key is
  // handed off as FLUX_API_KEY_FILE), so it is never a spend direction here.
  if (providerId === 'flux-router') return undefined;
  return providerId;
}

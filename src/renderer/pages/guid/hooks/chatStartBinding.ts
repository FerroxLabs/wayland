/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Build the `TProviderWithModel` binding a chat runs on from the NON-SECRET
 * handle `modelRegistry.resolveForChatStart` returns (#1124).
 *
 * The picker also looks the model up in the legacy `model.config` list, because
 * a few non-secret fields (a `new-api` per-model `modelProtocols` block) have no
 * home on the handle. That lookup is FUZZY - it matches any row whose `model[]`
 * contains the id - and it used to be spread underneath the handle wholesale.
 *
 * The field that made this a routing defect rather than cosmetics is
 * `__waylandModelRegistryBridge`. The handle does not carry it, so it survived
 * the spread, and `hydrateModelForSpawn` reads that tag FIRST when it decides
 * whose credentials to resolve - ahead of the `id` the handle just set. So a
 * model name two providers share (every Ollama tag is shared by the local daemon
 * and Ollama Cloud) could bind a keyless LOCAL pick to a different provider's
 * registry row. When that row is not connected, spawn resolution fails closed
 * and wipes `apiKey` AND `baseUrl`, and the OpenAI-compatible runtime then
 * throws `OpenAI API key is required` - naming a vendor the user never chose,
 * about a daemon on loopback that needs no key at all.
 *
 * So: the legacy row may contribute additive, non-secret metadata and nothing
 * else. Identity (`id`, `platform`, `name`, `baseUrl`, `useModel`, the bridge
 * tag) and credentials come from the handle, always.
 *
 * Pure - no IPC, no I/O.
 */

import type { TProviderWithModel } from '@/common/config/storage';

/** Prefix stamped on every mirrored `model.config` row (`v2:${providerId}`). */
const V2_BRIDGE_PREFIX = 'v2:';
const BRIDGE_TAG_KEY = '__waylandModelRegistryBridge';

/** The non-secret chat-start handle, as `resolveForChatStart` returns it. */
export type ChatStartHandle = {
  id: string;
  providerId?: string;
  name: string;
  platform: string;
  modelId: string;
  baseUrl: string;
  accountId?: string;
  modelProtocols?: Record<string, string>;
};

/** The only slice of a legacy `model.config` row this build is allowed to read. */
export type LegacyRowMetadata = { modelProtocols?: Record<string, string> };

export function buildChatStartBinding(
  handle: ChatStartHandle,
  legacyMatch: LegacyRowMetadata | undefined
): TProviderWithModel {
  // Only additive, non-secret metadata is inherited. Anything that decides which
  // provider is resolved - or which key is spent - is taken from the handle.
  const modelProtocols = handle.modelProtocols ?? legacyMatch?.modelProtocols;

  const binding: Record<string, unknown> = {
    ...(modelProtocols && typeof modelProtocols === 'object' ? { modelProtocols } : {}),
    id: handle.id,
    platform: handle.platform,
    name: handle.name,
    baseUrl: handle.baseUrl,
    // Handle only - no plaintext key crosses IPC; resolved in main at spawn.
    apiKey: '',
    useModel: handle.modelId,
    accountId: handle.accountId,
    // Stamped from the provider the user actually picked, never inherited.
    // `hydrateModelForSpawn` resolves credentials by this tag first.
    [BRIDGE_TAG_KEY]: `${V2_BRIDGE_PREFIX}${handle.providerId ?? handle.id}`,
  };
  return binding as unknown as TProviderWithModel;
}

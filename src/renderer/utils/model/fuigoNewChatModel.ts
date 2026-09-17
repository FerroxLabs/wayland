/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { modelRegistry } from '@/common/adapter/ipcBridge';
import { FLUX_PROVIDER_ID } from '@/common/config/flux';
import { resolveFuigoNewChatModel } from '@/common/config/fuigoNewChatModel';
import { ConfigStorage } from '@/common/config/storage';

/**
 * Reads what `resolveFuigoNewChatModel` needs and returns the model a new Fuigo
 * chat is created on. The ONE implementation behind both new-chat entry points
 * (the Guid page and a workspace tab), so the chip and the created chat agree.
 */
export async function loadFuigoNewChatModel(opts: { assistantId?: string } = {}): Promise<string | undefined> {
  const [acpConfig, savedDefault, cachedModels, assistants, fluxConnected] = await Promise.all([
    ConfigStorage.get('acp.config').catch((): undefined => undefined),
    ConfigStorage.get('fuigo.defaultModel').catch((): undefined => undefined),
    ConfigStorage.get('acp.cachedModels').catch((): undefined => undefined),
    opts.assistantId ? ConfigStorage.get('assistants').catch((): undefined => undefined) : undefined,
    modelRegistry.list
      .invoke()
      .then((providers) => Array.isArray(providers) && providers.some((p) => p.providerId === FLUX_PROVIDER_ID))
      .catch(() => false),
  ]);
  const assistant = Array.isArray(assistants) ? assistants.find((a) => a?.id === opts.assistantId) : undefined;
  return resolveFuigoNewChatModel({
    pickedModelId: acpConfig?.fuigo?.preferredModelId,
    savedDefaultModel: savedDefault?.useModel,
    assistantModels: assistant?.models,
    fluxConnected,
    advertisedModelIds: (cachedModels?.fuigo?.availableModels ?? []).map((m) => m.id),
  });
}

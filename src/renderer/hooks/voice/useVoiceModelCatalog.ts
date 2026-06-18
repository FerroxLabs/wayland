/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { useMemo } from 'react';
import {
  buildVoiceModelCatalog,
  type VoiceModelEntry,
} from '@/common/voice/voiceModelCatalog';

/**
 * Returns the merged voice-model catalog the settings picker renders from:
 * the in-repo built-ins plus any extension-contributed entries.
 *
 * ## Extension contribution
 * An extension may ship a `voice-models` array — either inline in its
 * `aion-extension.json` manifest or as a sibling `voice-models.json` — whose
 * entries match {@link VoiceModelEntry}. Those entries are merged here via
 * `buildVoiceModelCatalog`, which dedups by `engineId` + `modelId` and never
 * lets an extension override a built-in. See
 * `docs/architecture/voice-system.md` §4 for the manifest convention.
 *
 * ## Fetch wiring (follow-up)
 * The merge function + manifest convention ship now. The renderer read path
 * (an `extensions.getVoiceModels` IPC provider backed by `ExtensionRegistry`)
 * is a deliberate follow-up: adding it touches `src/common/adapter/ipcBridge.ts`
 * and the extensions bridge/registry, which a parallel task owns. Until that
 * provider lands, this hook surfaces the built-in catalog. When it lands, the
 * only change here is to fetch the extension entries (e.g. via a query hook)
 * and pass them as the `extra` argument below — no call site changes.
 */
export const useVoiceModelCatalog = (): VoiceModelEntry[] => {
  // TODO(voice-ext-fetch): once `extensions.getVoiceModels` exists, read it here
  // and pass the result into buildVoiceModelCatalog as `extra`.
  const extensionEntries: VoiceModelEntry[] = [];
  return useMemo(() => buildVoiceModelCatalog(extensionEntries), [extensionEntries]);
};

export default useVoiceModelCatalog;

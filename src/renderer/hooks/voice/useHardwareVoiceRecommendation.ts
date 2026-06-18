/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useMemo, useState } from 'react';
import { ipcBridge } from '@/common';
import {
  recommendVoiceModels,
  type HardwareInfo,
  type VoiceRecommendation,
} from '@/common/voice/hardwareRecommend';
import { useVoiceModelCatalog } from './useVoiceModelCatalog';

const EMPTY_PROVIDERS: ReadonlySet<string> = new Set();

/**
 * Fetches coarse hardware capabilities (RAM + arch) from the main process and
 * builds a local-first voice-model recommendation from the merged catalog.
 *
 * Renderer-only. Hardware info is read via the `application.hardwareInfo` IPC
 * provider. `signedInProviders` is optional — a sibling task owns the hook that
 * computes it; until that exists, pass nothing and the recommender stays fully
 * local (no cloud entry is ever recommended).
 *
 * Returns `null` until the hardware probe resolves, so callers can render a
 * placeholder while detection is in flight.
 */
export const useHardwareVoiceRecommendation = (
  signedInProviders: ReadonlySet<string> = EMPTY_PROVIDERS
): VoiceRecommendation | null => {
  const catalog = useVoiceModelCatalog();
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);

  useEffect(() => {
    let active = true;
    ipcBridge.application.hardwareInfo
      .invoke()
      .then((info) => {
        if (active) setHardware(info);
      })
      .catch((err) => {
        console.error('[useHardwareVoiceRecommendation] hardware probe failed:', err);
      });
    return () => {
      active = false;
    };
  }, []);

  return useMemo(() => {
    if (!hardware) return null;
    return recommendVoiceModels(hardware, catalog, signedInProviders);
  }, [hardware, catalog, signedInProviders]);
};

export default useHardwareVoiceRecommendation;

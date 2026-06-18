/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from 'react';
import { onSystemVoicesChanged } from '@/renderer/utils/systemVoice';

/** Reactive list of the OS's installed speech-synthesis voices (per platform).
 * Empty on machines with no voices installed (graceful — picker shows none). */
export const useSystemVoices = (): SpeechSynthesisVoice[] => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => onSystemVoicesChanged(setVoices), []);
  return voices;
};

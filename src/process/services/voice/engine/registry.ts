/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SttEngine, TtsEngine } from './types';

const ttsEngines = new Map<string, TtsEngine>();
const sttEngines = new Map<string, SttEngine>();

export const registerTtsEngine = (engine: TtsEngine): void => {
  ttsEngines.delete(engine.id); // re-register replaces, moving to the end of insertion order
  ttsEngines.set(engine.id, engine);
};
export const getTtsEngine = (id: string): TtsEngine | null => ttsEngines.get(id) ?? null;
export const listTtsEngines = (): TtsEngine[] => [...ttsEngines.values()];

export const registerSttEngine = (engine: SttEngine): void => {
  sttEngines.delete(engine.id);
  sttEngines.set(engine.id, engine);
};
export const getSttEngine = (id: string): SttEngine | null => sttEngines.get(id) ?? null;
export const listSttEngines = (): SttEngine[] => [...sttEngines.values()];

/** Test-only. */
export const _resetRegistryForTest = (): void => {
  ttsEngines.clear();
  sttEngines.clear();
};

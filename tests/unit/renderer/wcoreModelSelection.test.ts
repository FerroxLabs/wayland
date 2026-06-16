/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import type { IProvider } from '@/common/config/storage';
import { registryProviderIdFor } from '@/renderer/pages/conversation/platforms/wcore/useWCoreModelSelection';

describe('registryProviderIdFor', () => {
  it('uses the provider id embedded in a bridged legacy model.config row', () => {
    const bridged = {
      id: 'legacy-row-uuid',
      platform: 'openai-compatible',
      __waylandModelRegistryBridge: 'v2:ollama-local',
    } as Pick<IProvider, 'id' | 'platform'>;

    expect(registryProviderIdFor(bridged)).toBe('ollama-local');
  });

  it('falls back to the row id when no registry bridge tag is present', () => {
    expect(registryProviderIdFor({ id: 'openai', platform: 'openai' })).toBe('openai');
  });
});

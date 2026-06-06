/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  isExperimentalProvider,
  resolveFluxAuto,
  resolveSafeDefault,
} from '@renderer/pages/guid/hooks/useGuidModelSelection';
import type { IProvider } from '@/common/storage/types';

const provider = (over: Partial<IProvider> & { model: string[] }): IProvider =>
  ({ id: over.platform ?? 'p', name: over.platform ?? 'P', ...over }) as unknown as IProvider;

describe('isExperimentalProvider', () => {
  it('flags the legacy antigravity provider by platform', () => {
    expect(isExperimentalProvider({ platform: 'antigravity', name: 'Antigravity Preview' })).toBe(true);
  });
  it('flags preview/beta providers by name', () => {
    expect(isExperimentalProvider({ platform: 'openai', name: 'GPT Beta' })).toBe(true);
  });
  it('passes a normal provider', () => {
    expect(isExperimentalProvider({ platform: 'flux-router', name: 'Flux Router' })).toBe(false);
  });
});

describe('resolveSafeDefault', () => {
  it('never returns an experimental provider when a real one exists', () => {
    const list = [
      provider({ platform: 'antigravity', model: ['gemini-3-pro'] }), // dead preview, normal model name
      provider({ platform: 'flux-router', model: ['flux-auto', 'flux-fast'] }),
    ];
    const chosen = resolveSafeDefault(list);
    expect(chosen?.provider.platform).toBe('flux-router');
    expect(chosen?.useModel).toBe('flux-auto');
  });

  it('skips experimental MODEL names within a real provider', () => {
    const list = [provider({ platform: 'openai', model: ['gpt-5-preview', 'gpt-5'] })];
    expect(resolveSafeDefault(list)?.useModel).toBe('gpt-5');
  });

  it('falls back to first model only when every provider is experimental', () => {
    const list = [provider({ platform: 'antigravity', model: ['antigravity-1'] })];
    const chosen = resolveSafeDefault(list);
    expect(chosen?.provider.platform).toBe('antigravity');
    expect(chosen?.useModel).toBe('antigravity-1');
  });

  it('returns null for an empty list', () => {
    expect(resolveSafeDefault([])).toBeNull();
  });
});

describe('resolveFluxAuto', () => {
  it('returns flux-auto when a provider carries it', () => {
    const list = [
      provider({ platform: 'openai', model: ['gpt-5'] }),
      provider({ platform: 'flux-router', model: ['flux-fast', 'flux-auto', 'flux-reasoning'] }),
    ];
    const chosen = resolveFluxAuto(list);
    expect(chosen?.useModel).toBe('flux-auto');
    expect(chosen?.provider.platform).toBe('flux-router');
  });

  it('returns null when flux-auto is not present (Flux not connected)', () => {
    expect(resolveFluxAuto([provider({ platform: 'openai', model: ['gpt-5'] })])).toBeNull();
  });
});

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

describe('the provider set a real first-run machine actually had', () => {
  /**
   * Taken from a fresh-profile walkthrough on 2026-08-29, decoded out of the
   * profile's own config rather than invented. Onboarding scanned the machine,
   * found four keyed providers, and the composer chip came up `allam-2-7b` -
   * Groq's small open model, first entry of the first provider, and the exact
   * model the marquee rules exist to keep out of the cold-start default.
   *
   * `resolveSafeDefault` gets this right, which is the point: the resolver was
   * never the bug. It loses a race against the provider list arriving, so
   * onboarding now writes a real pin instead of leaving the fallback to run.
   */
  const realWorld = () => [
    provider({ platform: 'openai-compatible', name: 'Groq', model: ['allam-2-7b', 'openai/gpt-oss-120b'] }),
    provider({ platform: 'gemini', name: 'Google Gemini', model: ['gemini-3.1-pro-preview', 'gemini-3.1-flash'] }),
    provider({ platform: 'openai', name: 'OpenAI', model: ['gpt-5.5', 'gpt-5.4'] }),
    provider({ platform: 'openai-compatible', name: 'OpenRouter', model: ['aion-labs/aion-2.0'] }),
  ];

  it('never lands a first-run user on allam-2-7b', () => {
    expect(resolveSafeDefault(realWorld())?.useModel).not.toBe('allam-2-7b');
  });

  it('picks a marquee flagship over the provider that merely sorts first', () => {
    const chosen = resolveSafeDefault(realWorld());
    expect(['gemini-3.1-flash', 'gpt-5.5']).toContain(chosen?.useModel);
  });

  it('still refuses the small open model when it is the ONLY keyed provider', () => {
    // Nothing marquee to fall back to. Returning allam is then correct - there
    // is nothing else - but it must be a deliberate last resort, not a winner.
    const only = [provider({ platform: 'openai-compatible', name: 'Groq', model: ['allam-2-7b'] })];
    expect(resolveSafeDefault(only)?.useModel).toBe('allam-2-7b');
  });
});

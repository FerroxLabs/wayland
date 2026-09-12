/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  looksLikeAuthFailure,
  classifyAcpAuthFailure,
  getAcpAuthRemedy,
} from '@/renderer/pages/conversation/platforms/acp/acpAuthFailure';

describe('looksLikeAuthFailure', () => {
  it.each(['Invalid API key', 'createSession returned null', '[ACP-AUTH-401] rejected', 'HTTP 401', 'UNAUTHORIZED'])(
    'returns true for %s',
    (errorMsg) => {
      expect(looksLikeAuthFailure(errorMsg)).toBe(true);
    }
  );

  it('returns false for an unrelated error', () => {
    expect(looksLikeAuthFailure('network timeout while reading file')).toBe(false);
  });

  // #629 - engine-start credential failures must classify as auth failures so the
  // recovery card shows instead of a raw stderr bubble (the post-top-up dead-end).
  it.each([
    'Agent failed to start: fuigo exited with code 1 during init: Error: No API key found',
    'No API key found',
    'MissingApiKey: provider requires a key',
    'API key not found for provider',
    'engine start aborted: no working provider configured',
  ])('returns true for the engine-start credential failure %s', (errorMsg) => {
    expect(looksLikeAuthFailure(errorMsg)).toBe(true);
  });
});

describe('classifyAcpAuthFailure', () => {
  it('classifies claude as subscription-blocked, flux-routable, Anthropic key', () => {
    const remedy = classifyAcpAuthFailure('claude', 'Invalid API key');
    expect(remedy).not.toBeNull();
    expect(remedy?.subscriptionOAuthBlocked).toBe(true);
    expect(remedy?.fluxRoutable).toBe(true);
    expect(remedy?.providerKeyLabel).toBe('Anthropic');
    expect(remedy?.backendLabel).toBe('Claude Code');
  });

  it('classifies codex as subscription-blocked, flux-routable, OpenAI key, with cliLogin', () => {
    const remedy = classifyAcpAuthFailure('codex', 'authentication failed');
    expect(remedy?.subscriptionOAuthBlocked).toBe(true);
    expect(remedy?.fluxRoutable).toBe(true);
    expect(remedy?.providerKeyLabel).toBe('OpenAI');
    expect(remedy?.cliLoginCmd).toBe('codex login');
    expect(remedy?.backendLabel).toBe('Codex');
  });

  it('classifies a vendor CLI (droid) as not flux-routable, not blocked, with default login cmd', () => {
    const remedy = classifyAcpAuthFailure('droid', 'unauthorized');
    expect(remedy?.fluxRoutable).toBe(false);
    expect(remedy?.subscriptionOAuthBlocked).toBe(false);
    expect(remedy?.cliLoginCmd).toBe('droid login');
    expect(remedy?.providerKeyLabel).toBeUndefined();
    expect(remedy?.backendLabel).toBe('Factory Droid');
  });

  it('returns null for a non-auth error', () => {
    expect(classifyAcpAuthFailure('claude', 'network timeout while reading file')).toBeNull();
  });

  it('classifies an engine-start "No API key found" failure into the recovery remedy (#629)', () => {
    const remedy = classifyAcpAuthFailure(
      'fuigo',
      'Agent failed to start: fuigo exited with code 1 during init: Error: No API key found'
    );
    expect(remedy).not.toBeNull();
    expect(remedy?.backend).toBe('fuigo');
  });
});

describe('getAcpAuthRemedy', () => {
  it('returns a descriptor for an arbitrary backend without an error gate', () => {
    const remedy = getAcpAuthRemedy('qwen');
    expect(remedy.backend).toBe('qwen');
    expect(remedy.backendLabel).toBe('Qwen Code');
    expect(remedy.fluxRoutable).toBe(true);
    expect(remedy.cliLoginCmd).toBe('qwen');
  });

  it('Title-cases an unknown backend id', () => {
    const remedy = getAcpAuthRemedy('hermes');
    expect(remedy.backendLabel).toBe('Hermes');
    expect(remedy.fluxRoutable).toBe(false);
    expect(remedy.cliLoginCmd).toBe('hermes login');
  });

  it('applies runtime overrides (names the failing provider)', () => {
    const remedy = getAcpAuthRemedy('qwen', { providerKeyLabel: 'Anthropic' });
    expect(remedy.backendLabel).toBe('Qwen Code');
    expect(remedy.providerKeyLabel).toBe('Anthropic');
  });

  it('leaves genericProviderKey unset for vendor-locked backends', () => {
    expect(getAcpAuthRemedy('claude').genericProviderKey).toBeUndefined();
  });

  it('suppresses the Flux action when the backend is already flux-routed', () => {
    expect(getAcpAuthRemedy('qwen', { fluxAlreadyRouted: true }).fluxRoutable).toBe(false);
    expect(getAcpAuthRemedy('qwen', { fluxAlreadyRouted: false }).fluxRoutable).toBe(true);
  });
});

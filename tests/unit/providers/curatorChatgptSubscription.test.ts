import { describe, it, expect } from 'vitest';
import type { CatalogModel } from '@process/providers/types';
import { Curator } from '@process/providers/catalog/Curator';
import {
  buildChatGptSubscriptionCatalog,
  CHATGPT_SUBSCRIPTION_PROVIDER_ID,
} from '@process/providers/catalog/chatgptSubscriptionModels';

const curator = new Curator();

describe('Curator chatgpt-subscription exception', () => {
  it('keeps the whole static (unenriched) subscription catalog enabled + recommended', () => {
    // Regression: without the provider-id special-case the enrichment gate
    // (Rule 4) leaves every static model `enabled: false`, so a freshly
    // connected ChatGPT subscription shows its provider toggle OFF.
    const out = curator.curate(buildChatGptSubscriptionCatalog());
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((m) => m.enabled)).toBe(true);
    expect(out.every((m) => m.recommended)).toBe(true);
  });

  it('does not enable an identically-shaped model from another provider', () => {
    // Same unenriched/virtual shape but a different providerId must follow
    // normal curation and stay disabled - the exception is scoped by providerId.
    const impostor: CatalogModel = {
      id: 'gpt-5.2',
      providerId: 'openai',
      displayName: 'GPT-5.2',
      family: 'gpt-5.2',
      kind: 'text',
      enriched: false,
      tags: [],
    };
    const out = curator.curate([impostor]);
    expect(out.find((m) => m.id === 'gpt-5.2')?.enabled).toBe(false);
  });

  it('uses the canonical provider id', () => {
    expect(CHATGPT_SUBSCRIPTION_PROVIDER_ID).toBe('chatgpt-subscription');
  });
});

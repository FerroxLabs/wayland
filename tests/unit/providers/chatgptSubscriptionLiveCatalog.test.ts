import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the network layer so the live-fetch logic is exercised without a socket.
vi.mock('@process/utils/fetchWithRetry', () => ({ fetchWithRetry: vi.fn() }));

import {
  fetchLiveChatGptSubscriptionCatalog,
  buildChatGptSubscriptionCatalogLive,
  buildChatGptSubscriptionCatalog,
  CHATGPT_SUBSCRIPTION_MODEL_IDS,
} from '@process/providers/catalog/chatgptSubscriptionModels';
import { fetchWithRetry as fetchWithRetryReal } from '@process/utils/fetchWithRetry';

const fetchWithRetry = vi.mocked(fetchWithRetryReal);

const okResponse = (body: unknown) => ({ ok: true, json: async () => body }) as unknown as Response;

// A representative slice of the real `codex/models` payload (captured live).
const LIVE_BODY = {
  models: [
    { slug: 'gpt-5.5', display_name: 'GPT-5.5', context_window: 272000, visibility: 'list' },
    { slug: 'gpt-5.4', display_name: 'GPT-5.4', context_window: 272000, visibility: 'list' },
    { slug: 'gpt-5.4-mini', display_name: 'GPT-5.4-Mini', context_window: 272000, visibility: 'list' },
    { slug: 'codex-auto-review', display_name: 'Codex Auto Review', context_window: 272000, visibility: 'hide' },
  ],
};

beforeEach(() => fetchWithRetry.mockReset());

describe('ChatGPT subscription — live catalog', () => {
  it('fetches the live list, mapping slug + display name + context window', async () => {
    fetchWithRetry.mockResolvedValue(okResponse(LIVE_BODY));
    const out = await fetchLiveChatGptSubscriptionCatalog('tok-abc');
    expect(out).not.toBeNull();
    const gpt55 = out!.find((m) => m.id === 'gpt-5.5');
    expect(gpt55).toMatchObject({ id: 'gpt-5.5', displayName: 'GPT-5.5', contextWindow: 272000, enriched: false });
    expect(gpt55!.providerId).toBe('chatgpt-subscription');
  });

  it('drops non-list (internal/hidden) models like codex-auto-review', async () => {
    fetchWithRetry.mockResolvedValue(okResponse(LIVE_BODY));
    const out = await fetchLiveChatGptSubscriptionCatalog('tok-abc');
    expect(out!.map((m) => m.id)).toEqual(['gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini']);
    expect(out!.some((m) => m.id === 'codex-auto-review')).toBe(false);
  });

  it('sends client_version + bearer token to the codex models endpoint', async () => {
    fetchWithRetry.mockResolvedValue(okResponse(LIVE_BODY));
    await fetchLiveChatGptSubscriptionCatalog('tok-xyz');
    const [url, init] = fetchWithRetry.mock.calls[0];
    expect(url).toContain('backend-api/codex/models');
    expect(url).toContain('client_version=');
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer tok-xyz' });
  });

  it('returns null on a non-200 response (caller falls back)', async () => {
    fetchWithRetry.mockResolvedValue({ ok: false, json: async () => ({}) } as unknown as Response);
    expect(await fetchLiveChatGptSubscriptionCatalog('tok')).toBeNull();
  });

  it('returns null when the response body has no model list', async () => {
    fetchWithRetry.mockResolvedValue(okResponse({ unexpected: 'shape' }));
    expect(await fetchLiveChatGptSubscriptionCatalog('tok')).toBeNull();
  });

  it('returns null when json parsing throws', async () => {
    fetchWithRetry.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('bad json');
      },
    } as unknown as Response);
    expect(await fetchLiveChatGptSubscriptionCatalog('tok')).toBeNull();
  });

  it('returns null on an empty / unrecognized model list', async () => {
    fetchWithRetry.mockResolvedValue(okResponse({ models: [] }));
    expect(await fetchLiveChatGptSubscriptionCatalog('tok')).toBeNull();
  });

  it('returns null without a token (never hits the network)', async () => {
    expect(await fetchLiveChatGptSubscriptionCatalog('')).toBeNull();
    expect(fetchWithRetry).not.toHaveBeenCalled();
  });

  it('buildLive uses the live list when reachable', async () => {
    fetchWithRetry.mockResolvedValue(okResponse(LIVE_BODY));
    const out = await buildChatGptSubscriptionCatalogLive('tok');
    expect(out.map((m) => m.id)).toEqual(['gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini']);
  });

  it('buildLive falls back to the static snapshot when the fetch fails (non-200)', async () => {
    fetchWithRetry.mockResolvedValue({ ok: false, json: async () => ({}) } as unknown as Response);
    const out = await buildChatGptSubscriptionCatalogLive('tok');
    expect(out.map((m) => m.id)).toEqual([...CHATGPT_SUBSCRIPTION_MODEL_IDS]);
  });

  it('the static fallback is the current generation, not the dead gpt-5.2/5.1 slugs', () => {
    const ids = buildChatGptSubscriptionCatalog().map((m) => m.id);
    // Regression guard: the slugs that 400'd live must never come back.
    for (const dead of ['gpt-5.2', 'gpt-5.2-codex', 'gpt-5.1-codex', 'gpt-5.1', 'codex-mini-latest']) {
      expect(ids).not.toContain(dead);
    }
    expect(ids).toContain('gpt-5.5');
  });
});

import { describe, it, expect, vi } from 'vitest';
import { SkRaceResolver } from '../../src/process/providers/detection/skRaceResolver';
import type { ProviderId } from '../../src/process/providers/types';

const CANDIDATES: ProviderId[] = ['openai', 'deepseek', 'moonshot'];

function makeFetch(responses: Record<string, number>): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    // Find which provider this URL belongs to
    for (const [pattern, status] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return { status, ok: status === 200 } as Response;
      }
    }
    return { status: 401, ok: false } as Response;
  }) as unknown as typeof fetch;
}

describe('SkRaceResolver.resolve - matched', () => {
  it('returns matched when exactly one provider returns 200', async () => {
    const fetchFn = makeFetch({
      'openai.com': 200,
      'deepseek.com': 401,
      'moonshot.cn': 401,
    });
    const resolver = new SkRaceResolver(fetchFn);
    const result = await resolver.resolve('sk-testkey', CANDIDATES);
    expect(result.kind).toBe('matched');
    if (result.kind === 'matched') expect(result.provider).toBe('openai');
  });

  it('sends Authorization header with the key', async () => {
    const fetchFn = vi.fn(async () => ({ status: 200, ok: true } as Response)) as unknown as typeof fetch;
    const resolver = new SkRaceResolver(fetchFn);
    await resolver.resolve('sk-mykey123', ['openai']);
    expect(fetchFn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer sk-mykey123' }),
      })
    );
  });

  it('sends User-Agent: Wayland/1.0', async () => {
    const fetchFn = vi.fn(async () => ({ status: 200, ok: true } as Response)) as unknown as typeof fetch;
    const resolver = new SkRaceResolver(fetchFn);
    await resolver.resolve('sk-mykey123', ['openai']);
    expect(fetchFn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'User-Agent': 'Wayland/1.0' }),
      })
    );
  });
});

describe('SkRaceResolver.resolve - multiple', () => {
  it('returns multiple when 2+ providers return 200', async () => {
    const fetchFn = makeFetch({
      'openai.com': 200,
      'deepseek.com': 200,
      'moonshot.cn': 401,
    });
    const resolver = new SkRaceResolver(fetchFn);
    const result = await resolver.resolve('sk-testkey', CANDIDATES);
    expect(result.kind).toBe('multiple');
    if (result.kind === 'multiple') {
      expect(result.providers).toContain('openai');
      expect(result.providers).toContain('deepseek');
    }
  });
});

describe('SkRaceResolver.resolve - none', () => {
  it('returns none when no providers return 200', async () => {
    const fetchFn = makeFetch({
      'openai.com': 401,
      'deepseek.com': 403,
      'moonshot.cn': 429,
    });
    const resolver = new SkRaceResolver(fetchFn);
    const result = await resolver.resolve('sk-testkey', CANDIDATES);
    expect(result.kind).toBe('none');
    if (result.kind === 'none') {
      expect(result.tried).toEqual(expect.arrayContaining(CANDIDATES));
    }
  });

  it('treats non-200 non-4xx status as inconclusive (not a match)', async () => {
    const fetchFn = makeFetch({ 'openai.com': 500, 'deepseek.com': 503, 'moonshot.cn': 429 });
    const resolver = new SkRaceResolver(fetchFn);
    const result = await resolver.resolve('sk-testkey', CANDIDATES);
    expect(result.kind).toBe('none');
  });
});

describe('SkRaceResolver.resolve - error resilience', () => {
  it('treats fetch errors as inconclusive', async () => {
    const fetchFn = vi.fn(async () => { throw new Error('Network error'); }) as unknown as typeof fetch;
    const resolver = new SkRaceResolver(fetchFn);
    const result = await resolver.resolve('sk-testkey', CANDIDATES);
    expect(result.kind).toBe('none');
  });

  it('returns none for empty candidate list', async () => {
    const fetchFn = vi.fn() as unknown as typeof fetch;
    const resolver = new SkRaceResolver(fetchFn);
    const result = await resolver.resolve('sk-testkey', []);
    expect(result.kind).toBe('none');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('returns none for providers with no known endpoint', async () => {
    const fetchFn = vi.fn() as unknown as typeof fetch;
    const resolver = new SkRaceResolver(fetchFn);
    // 'openai-compatible' has no entry in PROVIDER_ENDPOINTS
    const result = await resolver.resolve('sk-testkey', ['openai-compatible']);
    expect(result.kind).toBe('none');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { runTtsChain, warmTtsChain } from '@process/services/voice/engine/chainRunner';
import { EngineHealthTracker } from '@process/services/voice/engine/engineHealth';
import { registerTtsEngine, _resetRegistryForTest } from '@process/services/voice/engine/registry';
import { EngineError, type TtsEngine, type TtsChunk } from '@process/services/voice/engine/types';

const engine = (id: string, behave: 'ok' | 'unavailable' | 'throws' | 'quota'): TtsEngine => ({
  id,
  local: true,
  streaming: false,
  available: async () => (behave === 'unavailable' ? { ok: false, reason: 'not installed' } : { ok: true }),
  voices: async () => [],
  synthesize: async (_t, _o, onChunk) => {
    if (behave === 'throws') throw new Error(`${id} exploded`);
    if (behave === 'quota') throw new EngineError('quota', 'credits exhausted');
    onChunk({ data: new Uint8Array([1]), mimeType: 'audio/wav', seq: 0, final: true });
  },
});

describe('runTtsChain', () => {
  it('uses the first available engine (ok result, engineUsed a, no notices, 1 chunk)', async () => {
    _resetRegistryForTest();
    const health = new EngineHealthTracker();
    registerTtsEngine(engine('a', 'ok'));
    registerTtsEngine(engine('b', 'ok'));

    const chunks: TtsChunk[] = [];
    const result = await runTtsChain(
      'hello',
      { chain: ['a', 'b'], engines: {} },
      (c) => chunks.push(c),
      undefined,
      health,
    );

    expect(result.ok).toBe(true);
    expect(result.engineUsed).toBe('a');
    expect(result.notices).toEqual([]);
    expect(chunks).toHaveLength(1);
  });

  it('skips unavailable engines WITHOUT a failover notice (engineUsed b, notices [])', async () => {
    _resetRegistryForTest();
    const health = new EngineHealthTracker();
    registerTtsEngine(engine('a', 'unavailable'));
    registerTtsEngine(engine('b', 'ok'));

    const chunks: TtsChunk[] = [];
    const result = await runTtsChain(
      'hello',
      { chain: ['a', 'b'], engines: {} },
      (c) => chunks.push(c),
      undefined,
      health,
    );

    expect(result.ok).toBe(true);
    expect(result.engineUsed).toBe('b');
    expect(result.notices).toEqual([]);
  });

  it('fails over on synthesis error WITH a notice ({failedEngine: a, fellBackTo: b}; ok true)', async () => {
    _resetRegistryForTest();
    const health = new EngineHealthTracker();
    registerTtsEngine(engine('a', 'throws'));
    registerTtsEngine(engine('b', 'ok'));

    const result = await runTtsChain(
      'hello',
      { chain: ['a', 'b'], engines: {} },
      () => {},
      undefined,
      health,
    );

    expect(result.ok).toBe(true);
    expect(result.engineUsed).toBe('b');
    expect(result.notices).toHaveLength(1);
    expect(result.notices[0]).toMatchObject({ failedEngine: 'a', fellBackTo: 'b' });
  });

  it('chain exhausted → ok: false, error contains "exploded"', async () => {
    _resetRegistryForTest();
    const health = new EngineHealthTracker();
    registerTtsEngine(engine('a', 'throws'));
    registerTtsEngine(engine('b', 'throws'));

    const result = await runTtsChain(
      'hello',
      { chain: ['a', 'b'], engines: {} },
      () => {},
      undefined,
      health,
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain('exploded');
  });

  it('passes per-engine voice/speed settings (opts.voice === af_nova)', async () => {
    _resetRegistryForTest();
    const health = new EngineHealthTracker();
    const synthSpy = vi.fn(async (_t: string, _o: { voice?: string; speed?: number }, onChunk: (c: TtsChunk) => void) => {
      onChunk({ data: new Uint8Array([1]), mimeType: 'audio/wav', seq: 0, final: true });
    });
    const eng: TtsEngine = {
      id: 'a',
      local: true,
      streaming: false,
      available: async () => ({ ok: true }),
      voices: async () => [],
      synthesize: synthSpy as unknown as TtsEngine['synthesize'],
    };
    registerTtsEngine(eng);

    await runTtsChain(
      'hello',
      { chain: ['a'], engines: { a: { voice: 'af_nova', speed: 1.2 } } },
      () => {},
      undefined,
      health,
    );

    expect(synthSpy).toHaveBeenCalledOnce();
    const [, opts] = synthSpy.mock.calls[0];
    expect(opts.voice).toBe('af_nova');
    expect(opts.speed).toBe(1.2);
  });

  it('HEALTH: quota error on first run causes second run to skip the failing engine', async () => {
    _resetRegistryForTest();
    const health = new EngineHealthTracker();

    const aSynth = vi.fn(async () => {
      throw new EngineError('quota', 'credits exhausted');
    });
    const bSynth = vi.fn(async (_t: string, _o: unknown, onChunk: (c: TtsChunk) => void) => {
      onChunk({ data: new Uint8Array([1]), mimeType: 'audio/wav', seq: 0, final: true });
    });

    const engA: TtsEngine = {
      id: 'a',
      local: true,
      streaming: false,
      available: async () => ({ ok: true }),
      voices: async () => [],
      synthesize: aSynth as unknown as TtsEngine['synthesize'],
    };
    const engB: TtsEngine = {
      id: 'b',
      local: true,
      streaming: false,
      available: async () => ({ ok: true }),
      voices: async () => [],
      synthesize: bSynth as unknown as TtsEngine['synthesize'],
    };
    registerTtsEngine(engA);
    registerTtsEngine(engB);

    // First run: 'a' throws quota, falls back to 'b'
    const first = await runTtsChain('hello', { chain: ['a', 'b'], engines: {} }, () => {}, undefined, health);
    expect(first.ok).toBe(true);
    expect(first.engineUsed).toBe('b');

    // Reset spies to track second run independently
    aSynth.mockClear();
    bSynth.mockClear();

    // Second run: 'a' is suspended so health.effectiveOrder puts it last; 'b' should run first
    const second = await runTtsChain('hello', { chain: ['a', 'b'], engines: {} }, () => {}, undefined, health);
    expect(second.ok).toBe(true);
    expect(second.engineUsed).toBe('b');
    expect(aSynth).not.toHaveBeenCalled();
  });

  it('aborted signal → ok: false, error "aborted"', async () => {
    _resetRegistryForTest();
    const health = new EngineHealthTracker();
    registerTtsEngine(engine('a', 'ok'));

    const controller = new AbortController();
    controller.abort();

    const result = await runTtsChain(
      'hello',
      { chain: ['a'], engines: {} },
      () => {},
      controller.signal,
      health,
    );

    expect(result.ok).toBe(false);
    expect(result.error).toBe('aborted');
  });
});

const warmableEngine = (
  id: string,
  opts: { available?: boolean; warmup?: () => Promise<void> } = {},
): TtsEngine => ({
  id,
  local: true,
  streaming: true,
  available: async () => ({ ok: opts.available !== false }),
  voices: async () => [],
  synthesize: async (_t, _o, onChunk) => onChunk({ data: new Uint8Array([1]), mimeType: 'audio/wav', seq: 0, final: true }),
  warmup: opts.warmup,
});

describe('warmTtsChain', () => {
  it('warms the first available engine that has a warmup and returns its id', async () => {
    _resetRegistryForTest();
    const health = new EngineHealthTracker();
    const aWarm = vi.fn(async () => {});
    const bWarm = vi.fn(async () => {});
    registerTtsEngine(warmableEngine('a', { warmup: aWarm }));
    registerTtsEngine(warmableEngine('b', { warmup: bWarm }));

    const result = await warmTtsChain({ chain: ['a', 'b'], engines: {} }, health);

    expect(result).toEqual({ warmed: 'a' });
    expect(aWarm).toHaveBeenCalledTimes(1);
    expect(bWarm).not.toHaveBeenCalled();
  });

  it('skips unavailable engines and warms the first available one', async () => {
    _resetRegistryForTest();
    const health = new EngineHealthTracker();
    const aWarm = vi.fn(async () => {});
    const bWarm = vi.fn(async () => {});
    registerTtsEngine(warmableEngine('a', { available: false, warmup: aWarm }));
    registerTtsEngine(warmableEngine('b', { warmup: bWarm }));

    const result = await warmTtsChain({ chain: ['a', 'b'], engines: {} }, health);

    expect(result).toEqual({ warmed: 'b' });
    expect(aWarm).not.toHaveBeenCalled();
    expect(bWarm).toHaveBeenCalledTimes(1);
  });

  it('skips engines without a warmup', async () => {
    _resetRegistryForTest();
    const health = new EngineHealthTracker();
    const bWarm = vi.fn(async () => {});
    registerTtsEngine(warmableEngine('a')); // no warmup
    registerTtsEngine(warmableEngine('b', { warmup: bWarm }));

    const result = await warmTtsChain({ chain: ['a', 'b'], engines: {} }, health);

    expect(result).toEqual({ warmed: 'b' });
    expect(bWarm).toHaveBeenCalledTimes(1);
  });

  it('returns {} and never throws when the warmup rejects', async () => {
    _resetRegistryForTest();
    const health = new EngineHealthTracker();
    registerTtsEngine(warmableEngine('a', { warmup: async () => { throw new Error('boom'); } }));

    const result = await warmTtsChain({ chain: ['a'], engines: {} }, health);

    expect(result).toEqual({});
  });

  it('returns {} when no engine in the chain can be warmed', async () => {
    _resetRegistryForTest();
    const health = new EngineHealthTracker();
    registerTtsEngine(warmableEngine('a')); // no warmup

    const result = await warmTtsChain({ chain: ['a', 'unknown'], engines: {} }, health);

    expect(result).toEqual({});
  });
});

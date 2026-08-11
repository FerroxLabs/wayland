/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_TTS_CONFIG, normalizeTextToSpeechConfig } from '@/common/types/ttsTypes';
import type { TextToSpeechConfig } from '@/common/types/ttsTypes';
import {
  WindowsNativeTtsError,
  buildWindowsNativeSpeechArgs,
  synthesizeWindowsNative,
  toWindowsSpeechRate,
  WINDOWS_NATIVE_TTS_SCRIPT,
  type WindowsNativeTtsRuntime,
} from '@process/services/voice/WindowsNativeTts';
import {
  buildSystemNativeSayArgs,
  synthesize,
  synthesizeOpenAI,
  synthesizeTurn,
  textToSpeechRegistry,
} from '@process/services/voice/TextToSpeechService';
import type { OpenAITtsRuntime, TextToSpeechUnavailableError } from '@process/services/voice/TextToSpeechService';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@process/utils/mainLogger', () => ({
  mainError: vi.fn(),
  mainLog: vi.fn(),
  mainWarn: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseConfig = (overrides: Partial<TextToSpeechConfig> = {}): TextToSpeechConfig => ({
  ...DEFAULT_TTS_CONFIG,
  enabled: true,
  provider: 'system-native',
  ...overrides,
});

/**
 * 44 bytes of real WAV header. The synthesizer refuses anything that is not
 * RIFF/WAVE, so a fake that returns `new Uint8Array([1,2,3])` would test the
 * refusal rather than the success path.
 */
const riffWaveBytes = (payloadBytes = 64): Uint8Array => {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + payloadBytes, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(22050, 24);
  header.writeUInt32LE(44100, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(payloadBytes, 40);
  return new Uint8Array(Buffer.concat([header, Buffer.alloc(payloadBytes)]));
};

/**
 * Stands in for PowerShell: records the executable, argv and environment it was
 * handed, then writes the WAV the real synthesizer would have written.
 */
const fakeWindowsNativeRuntime = (
  onRun?: (executable: string, args: string[], env: NodeJS.ProcessEnv) => Promise<void>
): WindowsNativeTtsRuntime & { calls: Array<{ executable: string; args: string[]; env: NodeJS.ProcessEnv }> } => {
  const calls: Array<{ executable: string; args: string[]; env: NodeJS.ProcessEnv }> = [];
  return {
    calls,
    run: async (executable, args, env) => {
      calls.push({ executable, args, env });
      if (onRun) {
        await onRun(executable, args, env);
        return;
      }
      const { writeFile } = await import('node:fs/promises');
      await writeFile(String(env.WAYLAND_TTS_WAV_FILE), riffWaveBytes());
    },
  };
};

const onWindows = async <T>(fn: () => Promise<T>): Promise<T> => {
  const original = process.platform;
  Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
  try {
    return await fn();
  } finally {
    Object.defineProperty(process, 'platform', { value: original, configurable: true });
  }
};

const fakeOpenAIRuntime = (overrides: Partial<OpenAITtsRuntime> = {}): OpenAITtsRuntime => ({
  resolveApiKey: vi.fn(async () => 'sk-test'),
  fetch: vi.fn(
    async () =>
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      })
  ),
  ...overrides,
});

// ---------------------------------------------------------------------------
// normalizeTextToSpeechConfig
// ---------------------------------------------------------------------------

describe('normalizeTextToSpeechConfig', () => {
  it('returns full defaults when called with no arguments', () => {
    const config = normalizeTextToSpeechConfig();
    expect(config).toEqual(DEFAULT_TTS_CONFIG);
  });

  /**
   * These three pin the default flip itself. The `toEqual(DEFAULT_TTS_CONFIG)`
   * assertion above cannot: it compares the default to itself and stays green
   * whichever way the flag points.
   */
  it('speaks for a user who has never opened voice settings', () => {
    expect(normalizeTextToSpeechConfig().enabled).toBe(true);
    expect(normalizeTextToSpeechConfig(undefined).enabled).toBe(true);
    expect(normalizeTextToSpeechConfig({}).enabled).toBe(true);
  });

  /**
   * The default provider is the ONLY thing the platform argument moves. A
   * Windows user who never opened Voice settings used to resolve to macOS
   * `say`, which throws before it reaches a synthesizer: no key, no consent,
   * no sound and no way to find out why. A stored choice is still never
   * rewritten, on any platform.
   */
  it('defaults a Windows profile to the Windows synthesizer, not macOS say', () => {
    expect(normalizeTextToSpeechConfig(undefined, 'win32').provider).toBe('windows-native');
    expect(normalizeTextToSpeechConfig({}, 'win32').provider).toBe('windows-native');
  });

  it('defaults a macOS profile to say', () => {
    expect(normalizeTextToSpeechConfig(undefined, 'darwin').provider).toBe('system-native');
  });

  it('leaves the historical default in place where there is no local synthesizer', () => {
    expect(normalizeTextToSpeechConfig(undefined, 'linux').provider).toBe(DEFAULT_TTS_CONFIG.provider);
  });

  it('never rewrites a stored provider because of the platform', () => {
    expect(normalizeTextToSpeechConfig({ provider: 'openai' }, 'win32').provider).toBe('openai');
    expect(normalizeTextToSpeechConfig({ provider: 'system-native' }, 'win32').provider).toBe('system-native');
  });

  it('drops the retired kokoro-local value to the platform default on read', () => {
    expect(normalizeTextToSpeechConfig({ provider: 'kokoro-local' } as never, 'win32').provider).toBe(
      'windows-native'
    );
    expect(normalizeTextToSpeechConfig({ provider: 'kokoro-local' } as never).provider).toBe(
      DEFAULT_TTS_CONFIG.provider
    );
  });

  it('never overrides a user who deliberately turned speech off', () => {
    expect(normalizeTextToSpeechConfig({ enabled: false }).enabled).toBe(false);
  });

  it('leaves unprompted auto-reading off', () => {
    expect(normalizeTextToSpeechConfig().autoReadResponses).toBe(false);
  });

  it('fills missing fields with defaults', () => {
    const config = normalizeTextToSpeechConfig({ enabled: true });
    expect(config.enabled).toBe(true);
    expect(config.provider).toBe(DEFAULT_TTS_CONFIG.provider);
    expect(config.voice).toBe(DEFAULT_TTS_CONFIG.voice);
    expect(config.speed).toBe(DEFAULT_TTS_CONFIG.speed);
    expect(config.autoReadResponses).toBe(DEFAULT_TTS_CONFIG.autoReadResponses);
  });

  it('preserves supplied values over defaults', () => {
    const config = normalizeTextToSpeechConfig({ provider: 'system-native', speed: 1.5, voice: 'en-us' });
    expect(config.provider).toBe('system-native');
    expect(config.speed).toBe(1.5);
    expect(config.voice).toBe('en-us');
  });

  it('preserves a supported OpenAI provider and bounds its model identifier', () => {
    const config = normalizeTextToSpeechConfig({ provider: 'openai', model: '  ' + 'm'.repeat(200) + '  ' });
    expect(config.provider).toBe('openai');
    expect(config.model).toHaveLength(128);
  });

  it.each(['grok', 'unknown'])('rejects the previously persisted unsupported provider %s', (provider) => {
    const config = normalizeTextToSpeechConfig({
      provider: provider as TextToSpeechConfig['provider'],
    });
    expect(config.provider).toBe(DEFAULT_TTS_CONFIG.provider);
  });

  it('clamps speed and bounds the voice identifier', () => {
    const config = normalizeTextToSpeechConfig({
      speed: 99,
      voice: '  ' + 'v'.repeat(200) + '  ',
    });
    expect(config.speed).toBe(2);
    expect(config.voice).toHaveLength(128);
  });
});

// ---------------------------------------------------------------------------
// OpenAI speech
// ---------------------------------------------------------------------------

describe('synthesizeOpenAI', () => {
  it('fails before making a request when OpenAI is not connected', async () => {
    const fetch = vi.fn();
    const runtime = fakeOpenAIRuntime({ resolveApiKey: vi.fn(async () => undefined), fetch });

    await expect(synthesizeOpenAI('Hello', baseConfig({ provider: 'openai' }), runtime)).rejects.toMatchObject({
      name: 'TextToSpeechUnavailableError',
      code: 'TTS_OPENAI_NOT_CONFIGURED',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses the official speech endpoint with the selected voice, model, speed, and bounded input', async () => {
    const fetch = vi.fn(
      async () =>
        new Response(new Uint8Array([7, 8, 9]), {
          status: 200,
          headers: { 'Content-Type': 'audio/mpeg' },
        })
    );
    const runtime = fakeOpenAIRuntime({ fetch });
    const text = 'x'.repeat(5000);

    await expect(
      synthesizeOpenAI(
        text,
        baseConfig({ provider: 'openai', voice: 'cedar', model: 'gpt-4o-mini-tts', speed: 1.25 }),
        runtime
      )
    ).resolves.toEqual({ data: new Uint8Array([7, 8, 9]), mimeType: 'audio/mpeg' });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/audio/speech');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ Authorization: 'Bearer sk-test', 'Content-Type': 'application/json' });
    expect(JSON.parse(String(init.body))).toEqual({
      model: 'gpt-4o-mini-tts',
      input: 'x'.repeat(4096),
      voice: 'cedar',
      response_format: 'mp3',
      speed: 1.25,
    });
  });

  it('maps authentication and rate-limit responses to stable public error codes', async () => {
    const config = baseConfig({ provider: 'openai' });
    await expect(
      synthesizeOpenAI(
        'Hello',
        config,
        fakeOpenAIRuntime({ fetch: vi.fn(async () => new Response('', { status: 401 })) })
      )
    ).rejects.toMatchObject({ code: 'TTS_OPENAI_AUTH_ERROR' });
    await expect(
      synthesizeOpenAI(
        'Hello',
        config,
        fakeOpenAIRuntime({ fetch: vi.fn(async () => new Response('', { status: 429 })) })
      )
    ).rejects.toMatchObject({ code: 'TTS_OPENAI_RATE_LIMITED' });
  });
});

// ---------------------------------------------------------------------------
// synthesizeWindowsNative - the Windows speech-out floor
// ---------------------------------------------------------------------------

describe('synthesizeWindowsNative', () => {
  it('returns a RIFF/WAVE buffer for a fixture string', async () => {
    const runtime = fakeWindowsNativeRuntime();
    const result = await onWindows(() =>
      synthesizeWindowsNative('testing one two three', baseConfig({ provider: 'windows-native' }), runtime)
    );
    expect(result.mimeType).toBe('audio/wav');
    expect(Buffer.from(result.data).subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(Buffer.from(result.data).subarray(8, 12).toString('ascii')).toBe('WAVE');
    expect(result.data.length).toBeGreaterThan(44);
  });

  /**
   * The security invariant, asserted three ways because one of them alone is
   * not enough: text never appears in argv, argv is byte-identical regardless
   * of the text, and the script carries no interpolation site at all.
   */
  it('never places the spoken text on the command line', async () => {
    const hostile = '"; New-Item -Path C:\\pwned.txt; #';
    const runtime = fakeWindowsNativeRuntime();
    await onWindows(() => synthesizeWindowsNative(hostile, baseConfig({ provider: 'windows-native' }), runtime));

    const { args } = runtime.calls[0];
    expect(args.join(' ')).not.toContain('pwned');
    expect(args.join(' ')).not.toContain('New-Item');
    expect(args).toEqual(buildWindowsNativeSpeechArgs());
  });

  it('emits an argv that does not vary with the text, the voice or the speed', async () => {
    const a = fakeWindowsNativeRuntime();
    const b = fakeWindowsNativeRuntime();
    await onWindows(() => synthesizeWindowsNative('one', baseConfig({ provider: 'windows-native' }), a));
    await onWindows(() =>
      synthesizeWindowsNative('$(rm -rf /)', baseConfig({ provider: 'windows-native', voice: 'Zira', speed: 1.8 }), b)
    );
    expect(a.calls[0].args).toEqual(b.calls[0].args);
  });

  it('carries the text through a file and the knobs through the environment', async () => {
    const runtime = fakeWindowsNativeRuntime();
    let staged = '';
    const capturing = fakeWindowsNativeRuntime(async (_exe, _args, env) => {
      const { readFile, writeFile } = await import('node:fs/promises');
      staged = await readFile(String(env.WAYLAND_TTS_TEXT_FILE), 'utf8');
      await writeFile(String(env.WAYLAND_TTS_WAV_FILE), riffWaveBytes());
    });
    void runtime;

    await onWindows(() =>
      synthesizeWindowsNative(
        'hello `whoami`',
        baseConfig({ provider: 'windows-native', voice: 'Microsoft Zira Desktop', speed: 1.5 }),
        capturing
      )
    );

    expect(staged).toBe('hello `whoami`');
    expect(capturing.calls[0].env.WAYLAND_TTS_VOICE).toBe('Microsoft Zira Desktop');
    expect(capturing.calls[0].env.WAYLAND_TTS_RATE).toBe('5');
  });

  it('runs the in-box PowerShell by absolute path, not by name', async () => {
    const runtime = fakeWindowsNativeRuntime();
    await onWindows(() => synthesizeWindowsNative('hi', baseConfig({ provider: 'windows-native' }), runtime));
    expect(runtime.calls[0].executable).toMatch(/System32[\\/]WindowsPowerShell[\\/]v1\.0[\\/]powershell\.exe$/);
  });

  it('leaves no interpolation site in the script itself', () => {
    expect(WINDOWS_NATIVE_TTS_SCRIPT).toContain('$env:WAYLAND_TTS_TEXT_FILE');
    expect(WINDOWS_NATIVE_TTS_SCRIPT).not.toMatch(/\$\{/);
  });

  it('maps the speed multiplier onto the bounded System.Speech rate', () => {
    expect(toWindowsSpeechRate(1)).toBe(0);
    expect(toWindowsSpeechRate(0.5)).toBe(-5);
    expect(toWindowsSpeechRate(2)).toBe(10);
    expect(toWindowsSpeechRate(99)).toBe(10);
    expect(toWindowsSpeechRate(-99)).toBe(-10);
  });

  it('fails with a named error rather than handing back an empty buffer', async () => {
    const runtime = fakeWindowsNativeRuntime(async (_exe, _args, env) => {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(String(env.WAYLAND_TTS_WAV_FILE), Buffer.alloc(0));
    });
    await expect(
      onWindows(() => synthesizeWindowsNative('hi', baseConfig({ provider: 'windows-native' }), runtime))
    ).rejects.toBeInstanceOf(WindowsNativeTtsError);
  });

  it('fails with a named error when the output is not a RIFF/WAVE file', async () => {
    const runtime = fakeWindowsNativeRuntime(async (_exe, _args, env) => {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(String(env.WAYLAND_TTS_WAV_FILE), Buffer.from('not audio at all, honestly'));
    });
    await expect(
      onWindows(() => synthesizeWindowsNative('hi', baseConfig({ provider: 'windows-native' }), runtime))
    ).rejects.toThrow(/^TTS_WINDOWS_NATIVE_UNAVAILABLE/);
  });

  it('refuses off Windows instead of spawning anything', async () => {
    const runtime = fakeWindowsNativeRuntime();
    const original = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    try {
      await expect(
        synthesizeWindowsNative('hi', baseConfig({ provider: 'windows-native' }), runtime)
      ).rejects.toThrow(/^TTS_WINDOWS_NATIVE_UNAVAILABLE/);
    } finally {
      Object.defineProperty(process, 'platform', { value: original, configurable: true });
    }
    expect(runtime.calls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// TextToSpeechService.synthesize - provider routing
// ---------------------------------------------------------------------------

describe('synthesize (TextToSpeechService)', () => {
  it('passes a selected macOS voice and bounded speaking rate to say', () => {
    expect(buildSystemNativeSayArgs('Hello', baseConfig({ voice: 'Samantha', speed: 1.25 }), '/tmp/x/s.wav')).toEqual([
      '-r',
      '219',
      '-v',
      'Samantha',
      '-o',
      '/tmp/x/s.wav',
      '--file-format=WAVE',
      '--data-format=LEI16@22050',
      'Hello',
    ]);
  });

  it('lets macOS choose its default voice when no explicit voice is selected', () => {
    expect(buildSystemNativeSayArgs('Hello', baseConfig({ voice: 'default' }), '/tmp/x/s.wav')).not.toContain('-v');
  });

  // The previous argv (`--output-file=/dev/stdout --data-format=aiff`) exited 1
  // with zero bytes on every macOS install, so `playback_completed` could never
  // fire for the default provider. A pure argv assertion cannot catch that -
  // only running the real binary can.
  it.runIf(process.platform === 'darwin')('produces a WAV that macOS say actually writes', async () => {
    const { mkdtemp, readFile, rm } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');

    const directory = await mkdtemp(join(tmpdir(), 'wayland-tts-test-'));
    const outputPath = join(directory, 'speech.wav');
    try {
      const args = buildSystemNativeSayArgs('hello there', baseConfig({ provider: 'system-native' }), outputPath);
      await promisify(execFile)('say', args);
      const bytes = await readFile(outputPath);
      expect(bytes.byteLength).toBeGreaterThan(1000);
      expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
      expect(bytes.subarray(8, 12).toString('ascii')).toBe('WAVE');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  /**
   * The test above proves the ARGV produces a real WAV. It does not prove the
   * service hands that WAV back, because it never calls the service - it shells
   * out to `say` itself and reads the file. Everything between (the temp
   * directory, the read-back, the Uint8Array conversion, the declared MIME
   * type, the `finally` cleanup) is the part the renderer actually receives,
   * and it had no execution coverage at all.
   *
   * That gap matters because of how this reaches the speaker. Test voice does
   * `new Blob([bytes], {type: result.mimeType})` -> `createObjectURL` ->
   * `new Audio(url).play()`. A service that returned zero bytes, or the right
   * bytes under the wrong MIME type, would still satisfy every mocked test in
   * the suite - each of them stubs `speak` with a four-byte fake - and would be
   * silent on real hardware.
   *
   * Honest scope: this proves the bytes handed to the player are a well-formed,
   * non-trivial RIFF/WAVE clip under the MIME type the Blob is built with. It
   * cannot prove audibility. Nothing in jsdom can - there is no AudioContext
   * and no output device. Whether sound actually leaves the speakers stays a
   * human check.
   */
  it.runIf(process.platform === 'darwin')(
    'system-native synthesis returns playable bytes, not just the right argv',
    async () => {
      const result = await synthesize('Hello there', baseConfig({ provider: 'system-native' }));

      const bytes = Buffer.from(result.data);
      expect(bytes.byteLength).toBeGreaterThan(1000);
      expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
      expect(bytes.subarray(8, 12).toString('ascii')).toBe('WAVE');
      // The exact string the renderer puts in the Blob type.
      expect(result.mimeType).toBe('audio/wav');
    },
    60_000
  );

  it('routes windows-native to the Windows synthesizer and returns audio', async () => {
    const runtime = fakeWindowsNativeRuntime();
    const result = await onWindows(() => synthesize('Hello', baseConfig({ provider: 'windows-native' }), runtime));
    expect(result.data.length).toBeGreaterThan(44);
    expect(result.mimeType).toBe('audio/wav');
  });

  it('routes OpenAI to its authenticated runtime', async () => {
    const runtime = fakeOpenAIRuntime();
    const result = await synthesize('Hello', baseConfig({ provider: 'openai' }), undefined, runtime);
    expect(result).toEqual({ data: new Uint8Array([1, 2, 3]), mimeType: 'audio/mpeg' });
    expect(runtime.fetch).toHaveBeenCalledOnce();
  });

  it('returns a typed unavailable error for system-native on non-macOS', async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    try {
      await expect(synthesize('Hello', baseConfig({ provider: 'system-native' }))).rejects.toMatchObject({
        name: 'TextToSpeechUnavailableError',
        code: 'TTS_SYSTEM_NATIVE_UNAVAILABLE',
      } satisfies Partial<TextToSpeechUnavailableError>);
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
    }
  });

  it('returns a typed unavailable error for windows-native off Windows', async () => {
    await expect(synthesize('Hi', baseConfig({ provider: 'windows-native' }))).rejects.toBeInstanceOf(
      WindowsNativeTtsError
    );
  });
});

// ---------------------------------------------------------------------------
// VOC-04: adapter registry + VoiceReceipt
// ---------------------------------------------------------------------------

describe('textToSpeechRegistry (VOC-04)', () => {
  it('registers every supported provider as an adapter', () => {
    expect(new Set(textToSpeechRegistry.providers())).toEqual(
      new Set(['system-native', 'windows-native', 'openai'])
    );
  });

  it('marks local engines on-device and hosted OpenAI off-device', () => {
    expect(textToSpeechRegistry.resolve('system-native').onDevice).toBe(true);
    expect(textToSpeechRegistry.resolve('windows-native').onDevice).toBe(true);
    expect(textToSpeechRegistry.resolve('openai').onDevice).toBe(false);
  });
});

describe('synthesizeTurn (VOC-04 VoiceReceipt)', () => {
  it('returns audio plus an on-device receipt for windows-native synthesis', async () => {
    const runtime = fakeWindowsNativeRuntime();
    const { audio, receipt } = await onWindows(() =>
      synthesizeTurn('Hello', baseConfig({ provider: 'windows-native', voice: 'en-us' }), {
        windowsNative: runtime,
      })
    );

    expect(audio.data.length).toBe(108);
    expect(receipt.modality).toBe('tts');
    expect(receipt.provider).toBe('windows-native');
    expect(receipt.model).toBe('windows-native:en-us');
    expect(receipt.terminalState).toBe('completed');
    // Observed usage: 'Hello' characters in, 4 audio bytes out.
    expect(receipt.usage.characterCount).toBe('Hello'.length);
    expect(receipt.usage.audioOutputBytes).toBe(108);
    // On-device → estimated zero cost.
    expect(receipt.cost).toEqual({
      status: 'estimated',
      amount: 0,
      currency: 'USD',
      basis: 'on-device inference; no marginal provider cost',
    });
    expect(receipt.content.responseDigest).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns a hosted receipt with unavailable cost for OpenAI synthesis', async () => {
    const runtime = fakeOpenAIRuntime();
    const { receipt } = await synthesizeTurn(
      'Read this',
      baseConfig({ provider: 'openai', model: 'gpt-4o-mini-tts' }),
      { openai: runtime }
    );

    expect(receipt.provider).toBe('openai');
    expect(receipt.model).toBe('gpt-4o-mini-tts');
    expect(receipt.cost.status).toBe('unavailable');
    expect(receipt.usage.characterCount).toBe('Read this'.length);
  });
});

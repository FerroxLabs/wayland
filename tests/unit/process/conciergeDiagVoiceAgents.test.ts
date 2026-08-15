/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The three sections the concierge diagnostics tool grew so Concierge can
 * answer "does my system work?" about voice, agent installs, and TVControl.
 *
 * Every case here is driven against REAL files in a temp dir rather than a
 * mocked filesystem, because the whole value of these sections is that they
 * report what is actually on disk. Three properties are asserted for each:
 * it reports the truth when the source is present, it degrades to
 * `available: false` (never a throw, never a guess) when the source is missing,
 * and nothing it emits carries a secret or an OS username.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createConciergeDiagServer } from '@process/resources/builtinMcp/conciergeDiagServer';
import { resolveLocalTtsProvider } from '@/common/types/ttsTypes';
import { RECEIPT_FILENAME } from '@process/services/agentInstaller/installManifest';

const FAKE_SECRET = 'sk-ant-api03-ABCDEF0123456789abcdef0123456789DEADBEEF1234';
const TVCONTROL_ID = 'com.ferroxlabs/tvcontrol';

/** Encode a config object the way initStorage's JsonFileBuilder writes it. */
function encodeConfig(data: unknown): string {
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

let tmpDir: string;
/** Env keys the factory falls back to; cleared so tests only see their deps. */
const ENV_KEYS = ['WAYLAND_VOICE_MODELS_DIR', 'WAYLAND_AGENT_INSTALL_ROOT', 'WAYLAND_CONFIG_PATH'] as const;
let savedEnv: Record<string, string | undefined>;

function tmp(...parts: string[]): string {
  return path.join(tmpDir, ...parts);
}

function writeFile(target: string, contents: string): string {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents, 'utf-8');
  return target;
}

/** A complete bundled whisper-tiny model tree under `<dir>/whisper-tiny`. */
function seedVoiceModel(dir: string): string {
  const modelDir = path.join(dir, 'whisper-tiny');
  writeFile(path.join(modelDir, 'config.json'), '{}');
  writeFile(path.join(modelDir, 'preprocessor_config.json'), '{}');
  writeFile(path.join(modelDir, 'tokenizer.json'), '{}');
  writeFile(path.join(modelDir, 'onnx', 'encoder_model_quantized.onnx'), 'weights');
  writeFile(path.join(modelDir, 'onnx', 'decoder_model_merged_quantized.onnx'), 'weights');
  return modelDir;
}

function writeReceipt(prefix: string, receipt: Record<string, unknown>): void {
  writeFile(path.join(prefix, RECEIPT_FILENAME), JSON.stringify(receipt, null, 2));
}

/** A managed agent whose receipt and launch target are both intact. */
function seedHealthyAgent(root: string, agentId: string): string {
  const prefix = path.join(root, agentId);
  const bin = writeFile(path.join(prefix, 'node_modules', '.bin', agentId), '#!/bin/sh\n');
  writeReceipt(prefix, {
    agentId,
    npmPackage: `@vendor/${agentId}`,
    version: '1.2.3',
    prefix,
    launchSpec: { command: bin, args: ['acp'] },
    installedAt: '2026-08-01T00:00:00.000Z',
  });
  return prefix;
}

function writeMcpConfig(servers: unknown[]): string {
  return writeFile(tmp('config', 'wayland-config.txt'), encodeConfig({ 'mcp.config': servers }));
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'concierge-diag-voice-'));
  savedEnv = {};
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

// ---------------------------------------------------------------------------
// voice
// ---------------------------------------------------------------------------

describe('conciergeDiag voice section', () => {
  it('reports the bundled speech model as present when the model tree is complete', () => {
    const modelsDir = tmp('voice-models');
    seedVoiceModel(modelsDir);

    const voice = createConciergeDiagServer({ voiceModelsDir: modelsDir }).voice();

    expect(voice.available).toBe(true);
    expect(voice.stt.bundledModelPresent).toBe(true);
    expect(voice.stt.missingFiles).toEqual([]);
    expect(voice.stt.whyProblem).toBeNull();
    expect(voice.stt.modelDir).toContain('whisper-tiny');
  });

  it('degrades to available:false when the voice models env var is not injected', () => {
    const voice = createConciergeDiagServer({}).voice();

    expect(voice.available).toBe(false);
    expect(voice.source).toBe('voice models dir not set');
    expect(voice.stt.bundledModelPresent).toBe(false);
    expect(voice.stt.modelDir).toBeNull();
    // Not knowing is reported as not knowing, not as a broken install.
    expect(voice.stt.whyProblem).toContain('could not be checked');
  });

  it('degrades to available:false when the injected model path does not exist', () => {
    const voice = createConciergeDiagServer({ voiceModelsDir: tmp('nope') }).voice();

    expect(voice.available).toBe(false);
    expect(voice.source).toContain('voice models dir unavailable');
    expect(voice.stt.bundledModelPresent).toBe(false);
    expect(voice.stt.whyProblem).toContain('not on disk');
  });

  it('reports an incomplete model as not present and names what is missing', () => {
    const modelsDir = tmp('voice-models');
    const modelDir = seedVoiceModel(modelsDir);
    fs.rmSync(path.join(modelDir, 'tokenizer.json'));
    fs.rmSync(path.join(modelDir, 'onnx'), { recursive: true });

    const voice = createConciergeDiagServer({ voiceModelsDir: modelsDir }).voice();

    // The directory IS readable, so the section is available — the model inside
    // it is what is broken, and that distinction is the whole point.
    expect(voice.available).toBe(true);
    expect(voice.stt.bundledModelPresent).toBe(false);
    expect(voice.stt.missingFiles).toEqual(['tokenizer.json', 'onnx/*.onnx']);
    expect(voice.stt.whyProblem).toContain('incomplete');
  });

  it('reports weights-only as incomplete (a tokenizer-less model cannot transcribe)', () => {
    const modelsDir = tmp('voice-models');
    const modelDir = seedVoiceModel(modelsDir);
    fs.rmSync(path.join(modelDir, 'tokenizer.json'));

    const voice = createConciergeDiagServer({ voiceModelsDir: modelsDir }).voice();

    expect(voice.stt.bundledModelPresent).toBe(false);
    expect(voice.stt.missingFiles).toEqual(['tokenizer.json']);
  });

  it('resolves the same local TTS provider as resolveLocalTtsProvider on every platform', () => {
    // The server restates the platform mapping locally rather than importing it
    // (the subprocess keeps zero app imports). This is the drift guard that
    // makes the restatement safe.
    for (const platform of ['darwin', 'win32', 'linux', 'freebsd']) {
      vi.spyOn(os, 'platform').mockReturnValue(platform as NodeJS.Platform);
      const voice = createConciergeDiagServer({ voiceModelsDir: tmp('voice-models') }).voice();
      expect(voice.tts.platform).toBe(platform);
      expect(voice.tts.resolvedLocalProvider).toBe(resolveLocalTtsProvider(platform));
    }
  });

  it('names the missing local synthesizer on a platform that has none', () => {
    vi.spyOn(os, 'platform').mockReturnValue('linux' as NodeJS.Platform);
    const voice = createConciergeDiagServer({}).voice();

    expect(voice.tts.resolvedLocalProvider).toBeNull();
    expect(voice.tts.whyProblem).toContain('no built-in speech synthesizer');
  });

  it('reports TTS resolution WITHOUT claiming a voice is installed or audible', () => {
    vi.spyOn(os, 'platform').mockReturnValue('darwin' as NodeJS.Platform);
    const voice = createConciergeDiagServer({}).voice();

    expect(voice.tts.resolvedLocalProvider).toBe('system-native');
    expect(voice.tts.whyProblem).toBeNull();
    // The note is the guard against the claim we cannot support: nothing in the
    // codebase enumerates installed OS voices.
    expect(voice.tts.note).toContain('does NOT check');
    // The precise invariant: the speech-out leg emits NO boolean verdict at all.
    // A single `available: true` here would be the unsupportable claim, because
    // nothing in the codebase enumerates the voices an OS actually has.
    expect(voice.tts).not.toHaveProperty('available');
    expect(Object.values(voice.tts).some((v) => typeof v === 'boolean')).toBe(false);
  });

  it('still reports TTS resolution when the STT source is unreadable', () => {
    const voice = createConciergeDiagServer({}).voice();

    expect(voice.available).toBe(false);
    expect(voice.tts.platform).toBe(os.platform());
  });
});

// ---------------------------------------------------------------------------
// agentInstalls
// ---------------------------------------------------------------------------

describe('conciergeDiag agentInstalls section', () => {
  it('reports an intact install as ok, with the receipt version', () => {
    const root = tmp('agents');
    seedHealthyAgent(root, 'kimi');

    const section = createConciergeDiagServer({ agentInstallRoot: root }).agentInstalls();

    expect(section.available).toBe(true);
    expect(section.items).toHaveLength(1);
    expect(section.items[0]).toMatchObject({
      agentId: 'kimi',
      status: 'ok',
      version: '1.2.3',
      installedAt: '2026-08-01T00:00:00.000Z',
      missingLaunchTargets: [],
      whyProblem: null,
    });
  });

  it('distinguishes an orphaned install folder from one that was never created', () => {
    const root = tmp('agents');
    seedHealthyAgent(root, 'kimi');
    fs.mkdirSync(path.join(root, 'codex'), { recursive: true });

    const section = createConciergeDiagServer({ agentInstallRoot: root }).agentInstalls();
    const byId = Object.fromEntries(section.items.map((i) => [i.agentId, i]));

    expect(byId.kimi.status).toBe('ok');
    expect(byId.codex.status).toBe('receipt-missing');
    expect(byId.codex.whyProblem).toContain('no install receipt');
    // The agent that was never installed simply is not listed — that is the
    // case the app already handles correctly.
    expect(byId.auggie).toBeUndefined();
  });

  it('flags a receipt whose launch target is gone — the case the app cannot see', () => {
    const root = tmp('agents');
    const prefix = path.join(root, 'codex');
    const bin = path.join(prefix, 'node_modules', '.bin', 'codex-acp');
    writeReceipt(prefix, {
      agentId: 'codex',
      npmPackage: '@agentclientprotocol/codex-acp',
      version: '1.1.2',
      prefix,
      launchSpec: { command: bin, args: [] },
      installedAt: '2026-08-01T00:00:00.000Z',
    });

    const section = createConciergeDiagServer({ agentInstallRoot: root }).agentInstalls();

    expect(section.items[0].status).toBe('launch-target-missing');
    expect(section.items[0].missingLaunchTargets).toHaveLength(1);
    expect(section.items[0].missingLaunchTargets[0]).toContain('codex-acp');
    expect(section.items[0].version).toBe('1.1.2');
  });

  it('flags a missing JS entry point named in args, not just a missing command', () => {
    // The pure-JS agents launch through a runtime that always exists; what goes
    // missing is the package entry inside the prefix, carried in args.
    const root = tmp('agents');
    const prefix = path.join(root, 'kimi');
    writeReceipt(prefix, {
      agentId: 'kimi',
      npmPackage: '@moonshot-ai/kimi-code',
      version: '0.34.0',
      prefix,
      launchSpec: {
        command: process.execPath,
        args: [path.join(prefix, 'node_modules', '@moonshot-ai', 'kimi-code', 'dist', 'main.mjs'), 'acp'],
      },
      installedAt: '2026-08-01T00:00:00.000Z',
    });

    const section = createConciergeDiagServer({ agentInstallRoot: root }).agentInstalls();

    expect(section.items[0].status).toBe('launch-target-missing');
    expect(section.items[0].missingLaunchTargets[0]).toContain('main.mjs');
  });

  it('flags an unreadable receipt', () => {
    const root = tmp('agents');
    writeFile(path.join(root, 'kimi', RECEIPT_FILENAME), 'not json at all {');

    const section = createConciergeDiagServer({ agentInstallRoot: root }).agentInstalls();

    expect(section.items[0].status).toBe('receipt-unreadable');
    expect(section.items[0].whyProblem).toContain('not readable JSON');
  });

  it('flags a receipt with no usable launch command', () => {
    const root = tmp('agents');
    const prefix = path.join(root, 'kimi');
    writeReceipt(prefix, {
      agentId: 'kimi',
      npmPackage: '@moonshot-ai/kimi-code',
      version: '0.34.0',
      prefix,
      launchSpec: { args: ['acp'] },
      installedAt: '2026-08-01T00:00:00.000Z',
    });

    const section = createConciergeDiagServer({ agentInstallRoot: root }).agentInstalls();

    expect(section.items[0].status).toBe('receipt-unreadable');
    expect(section.items[0].whyProblem).toContain('no usable launch command');
  });

  it('flags a receipt copied in from another profile (prefix disagrees)', () => {
    const root = tmp('agents');
    const prefix = path.join(root, 'kimi');
    const bin = writeFile(path.join(prefix, 'node_modules', '.bin', 'kimi'), '#!/bin/sh\n');
    writeReceipt(prefix, {
      agentId: 'kimi',
      npmPackage: '@moonshot-ai/kimi-code',
      version: '0.34.0',
      prefix: path.join(root, 'somewhere-else', 'kimi'),
      launchSpec: { command: bin, args: [] },
      installedAt: '2026-08-01T00:00:00.000Z',
    });

    const section = createConciergeDiagServer({ agentInstallRoot: root }).agentInstalls();

    expect(section.items[0].status).toBe('receipt-mismatch');
    expect(section.items[0].whyProblem).toContain('different install folder');
  });

  it('flags a receipt naming a different agent', () => {
    const root = tmp('agents');
    const prefix = path.join(root, 'kimi');
    const bin = writeFile(path.join(prefix, 'node_modules', '.bin', 'kimi'), '#!/bin/sh\n');
    writeReceipt(prefix, {
      agentId: 'codex',
      npmPackage: '@agentclientprotocol/codex-acp',
      version: '1.1.2',
      prefix,
      launchSpec: { command: bin, args: [] },
      installedAt: '2026-08-01T00:00:00.000Z',
    });

    const section = createConciergeDiagServer({ agentInstallRoot: root }).agentInstalls();

    expect(section.items[0].status).toBe('receipt-mismatch');
    expect(section.items[0].whyProblem).toContain('belongs to "codex"');
  });

  it('degrades to available:false when the install-root env var is not injected', () => {
    const section = createConciergeDiagServer({}).agentInstalls();

    expect(section.available).toBe(false);
    expect(section.source).toBe('agent install root not set');
    expect(section.items).toEqual([]);
  });

  it('degrades to available:false when the injected install root does not exist', () => {
    const section = createConciergeDiagServer({ agentInstallRoot: tmp('nope') }).agentInstalls();

    expect(section.available).toBe(false);
    expect(section.source).toContain('agent install root unavailable');
    expect(section.items).toEqual([]);
  });

  it('reports an empty install root as available with no items', () => {
    const root = tmp('agents');
    fs.mkdirSync(root, { recursive: true });

    const section = createConciergeDiagServer({ agentInstallRoot: root }).agentInstalls();

    expect(section.available).toBe(true);
    expect(section.items).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// tvControl
// ---------------------------------------------------------------------------

describe('conciergeDiag tvControl section', () => {
  it('reports the connector as present and enabled', () => {
    const configPath = writeMcpConfig([
      { name: 'TVControl', libraryEntryId: TVCONTROL_ID, enabled: true, status: 'connected', tools: [{}, {}, {}] },
    ]);

    const section = createConciergeDiagServer({ configPath }).tvControl();

    expect(section.available).toBe(true);
    expect(section.info).toMatchObject({
      present: true,
      enabled: true,
      status: 'connected',
      toolCount: 3,
      whyProblem: null,
    });
  });

  it('reports the connector as absent when nothing carries its library id', () => {
    const configPath = writeMcpConfig([{ name: 'Something Else', libraryEntryId: 'com.acme/other', enabled: true }]);

    const section = createConciergeDiagServer({ configPath }).tvControl();

    expect(section.available).toBe(true);
    expect(section.info.present).toBe(false);
    expect(section.info.whyProblem).toContain('not installed');
  });

  it('matches on libraryEntryId, not on the user-editable display name', () => {
    const configPath = writeMcpConfig([
      { name: 'my renamed chart tool', libraryEntryId: TVCONTROL_ID, enabled: true, tools: [{}] },
      { name: 'com.ferroxlabs/tvcontrol', libraryEntryId: 'com.acme/impostor', enabled: true, tools: [{}] },
    ]);

    const section = createConciergeDiagServer({ configPath }).tvControl();

    expect(section.info.present).toBe(true);
    expect(section.info.enabled).toBe(true);
  });

  it('explains a connector that is installed but switched off', () => {
    const configPath = writeMcpConfig([{ name: 'TVControl', libraryEntryId: TVCONTROL_ID, enabled: false }]);

    const section = createConciergeDiagServer({ configPath }).tvControl();

    expect(section.info).toMatchObject({ present: true, enabled: false });
    expect(section.info.whyProblem).toContain('switched off');
  });

  it('explains a connector that is on but exposes no tools', () => {
    const configPath = writeMcpConfig([{ name: 'TVControl', libraryEntryId: TVCONTROL_ID, enabled: true, tools: [] }]);

    const section = createConciergeDiagServer({ configPath }).tvControl();

    expect(section.info.whyProblem).toContain('exposes no tools');
  });

  it('never implies it connected to TVControl or TradingView', () => {
    const configPath = writeMcpConfig([
      { name: 'TVControl', libraryEntryId: TVCONTROL_ID, enabled: true, tools: [{}] },
    ]);

    const section = createConciergeDiagServer({ configPath }).tvControl();

    expect(section.info.note).toContain('cannot connect');
    expect(section.info.note).toContain('not proof');
  });

  it('degrades to available:false when the config env var is not injected', () => {
    const section = createConciergeDiagServer({}).tvControl();

    expect(section.available).toBe(false);
    expect(section.source).toBe('config path not set');
    expect(section.info.present).toBe(false);
  });

  it('degrades to available:false when the injected config path does not exist', () => {
    const section = createConciergeDiagServer({ configPath: tmp('missing-config.txt') }).tvControl();

    expect(section.available).toBe(false);
    expect(section.source).toContain('config unavailable');
    expect(section.info.present).toBe(false);
  });

  it('degrades to available:false when the config has no mcp.config array', () => {
    const configPath = writeFile(tmp('config', 'wayland-config.txt'), encodeConfig({ 'something.else': 1 }));

    const section = createConciergeDiagServer({ configPath }).tvControl();

    expect(section.available).toBe(false);
    expect(section.source).toBe('config has no mcp.config array');
  });
});

// ---------------------------------------------------------------------------
// sanitization — every new string still goes through the choke point
// ---------------------------------------------------------------------------

describe('conciergeDiag new sections are sanitized', () => {
  it('masks a secret carried in the TVControl lastError', () => {
    const configPath = writeMcpConfig([
      {
        name: 'TVControl',
        libraryEntryId: TVCONTROL_ID,
        enabled: true,
        tools: [{}],
        lastError: `auth failed with ${FAKE_SECRET}`,
      },
    ]);

    const section = createConciergeDiagServer({ configPath }).tvControl();
    const serialized = JSON.stringify(section);

    expect(serialized).not.toContain(FAKE_SECRET);
    expect(section.info.lastError).toContain('••••');
    // It also reaches the derived plain-English sentence, which quotes it.
    expect(section.info.whyProblem).not.toContain(FAKE_SECRET);
  });

  it('scrubs an OS username out of a missing launch-target path', () => {
    const root = tmp('agents');
    const prefix = path.join(root, 'kimi');
    writeReceipt(prefix, {
      agentId: 'kimi',
      npmPackage: '@moonshot-ai/kimi-code',
      version: '0.34.0',
      prefix,
      launchSpec: { command: '/Users/someuser/gone/bin/kimi', args: [] },
      installedAt: '2026-08-01T00:00:00.000Z',
    });

    const section = createConciergeDiagServer({ agentInstallRoot: root }).agentInstalls();
    const serialized = JSON.stringify(section);

    expect(section.items[0].status).toBe('launch-target-missing');
    expect(serialized).not.toContain('someuser');
    expect(section.items[0].missingLaunchTargets[0]).toBe('/Users/<user>/gone/bin/kimi');
  });

  it('scrubs the real home directory out of the voice model path', () => {
    const home = os.homedir();
    const modelsDir = tmp('voice-models');
    seedVoiceModel(modelsDir);
    // Force the scrub to have something to find without writing into the real
    // home: point scrubHome's layer-1 rule at this temp tree.
    vi.spyOn(os, 'homedir').mockReturnValue(tmpDir);

    const voice = createConciergeDiagServer({ voiceModelsDir: modelsDir }).voice();

    expect(voice.stt.modelDir).toBe(path.join('~', 'voice-models', 'whisper-tiny'));
    expect(voice.stt.modelDir).not.toContain(tmpDir);
    expect(home).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// overview
// ---------------------------------------------------------------------------

describe('conciergeDiag overview', () => {
  it('carries all three new sections', () => {
    const modelsDir = tmp('voice-models');
    seedVoiceModel(modelsDir);
    const root = tmp('agents');
    seedHealthyAgent(root, 'kimi');
    const configPath = writeMcpConfig([
      { name: 'TVControl', libraryEntryId: TVCONTROL_ID, enabled: true, tools: [{}] },
    ]);

    const overview = createConciergeDiagServer({
      voiceModelsDir: modelsDir,
      agentInstallRoot: root,
      configPath,
    }).overview();

    expect(overview.voice.stt.bundledModelPresent).toBe(true);
    expect(overview.agentInstalls.items.map((i) => i.status)).toEqual(['ok']);
    expect(overview.tvControl.info.present).toBe(true);
  });

  it('still returns all three sections, degraded, when nothing is injected', () => {
    const overview = createConciergeDiagServer({}).overview();

    expect(overview.voice.available).toBe(false);
    expect(overview.agentInstalls.available).toBe(false);
    expect(overview.tvControl.available).toBe(false);
    // Degrading is not throwing: the shapes are still there for the model.
    expect(overview.agentInstalls.items).toEqual([]);
    expect(overview.tvControl.info.note).toContain('cannot connect');
  });
});

/**
 * Unit tests for per-conversation effort flowing into the Flux-routed claude
 * config (`materializeFluxClaudeConfigDir`). When the conversation carries
 * `extra.effort`, the produced settings.json `effortLevel` must equal it
 * (overriding any user-level seed); absence must preserve the prior behavior
 * (seed the user's `effortLevel` when present, otherwise omit it).
 *
 * Uses a real temp dir (no fs mocking) and reads the materialized settings back.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { materializeFluxClaudeConfigDir } from '@process/task/claudeConfig';

describe('materializeFluxClaudeConfigDir - per-conversation effort', () => {
  let userDataDir: string;
  let realClaudeDir: string;

  beforeEach(async () => {
    userDataDir = await mkdtemp(join(tmpdir(), 'claude-effort-data-'));
    realClaudeDir = await mkdtemp(join(tmpdir(), 'claude-effort-real-'));
  });
  afterEach(async () => {
    await rm(userDataDir, { recursive: true, force: true });
    await rm(realClaudeDir, { recursive: true, force: true });
  });

  const seedReal = async (settings: Record<string, unknown>): Promise<void> => {
    await mkdir(realClaudeDir, { recursive: true });
    await writeFile(join(realClaudeDir, 'settings.json'), JSON.stringify(settings), 'utf8');
  };
  const readSettings = async (dir: string): Promise<Record<string, unknown>> =>
    JSON.parse(await readFile(join(dir, 'settings.json'), 'utf8'));

  it('sets effortLevel to the conversation effort', async () => {
    const configDir = await materializeFluxClaudeConfigDir(userDataDir, realClaudeDir, 'high');
    const settings = await readSettings(configDir);
    expect(settings.effortLevel).toBe('high');
  });

  it('conversation effort overrides the user-level seeded effortLevel', async () => {
    await seedReal({ effortLevel: 'low' });
    const configDir = await materializeFluxClaudeConfigDir(userDataDir, realClaudeDir, 'high');
    const settings = await readSettings(configDir);
    expect(settings.effortLevel).toBe('high');
  });

  it('without conversation effort, preserves the user seed (prior default)', async () => {
    await seedReal({ effortLevel: 'low' });
    const configDir = await materializeFluxClaudeConfigDir(userDataDir, realClaudeDir);
    const settings = await readSettings(configDir);
    expect(settings.effortLevel).toBe('low');
  });

  it('without conversation effort and no user seed, omits effortLevel (prior default)', async () => {
    const configDir = await materializeFluxClaudeConfigDir(userDataDir, realClaudeDir);
    const settings = await readSettings(configDir);
    expect(settings.effortLevel).toBeUndefined();
  });
});

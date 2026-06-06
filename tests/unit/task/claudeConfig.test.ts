/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for `materializeFluxClaudeConfigDir`: the scoped CLAUDE_CONFIG_DIR that
 * makes the claude-agent-acp bridge accept `flux-auto`. The bridge only honors a
 * non-SDK model id when it appears in `availableModels` of the user settings.json
 * it reads from `<CLAUDE_CONFIG_DIR>/settings.json`. This materializer writes that
 * file (seeded from the user's real ~/.claude/settings.json so user-level
 * permissions/effort survive) with the four Flux ids added to `availableModels`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { FLUX_MODEL_IDS } from '@/common/config/flux';
import { materializeFluxClaudeConfigDir } from '@process/task/claudeConfig';

const tmpDirs: string[] = [];
afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

async function makeUserData(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'wl-claudecfg-'));
  tmpDirs.push(dir);
  return dir;
}

describe('materializeFluxClaudeConfigDir', () => {
  it('writes settings.json with every Flux id in availableModels', async () => {
    const userData = await makeUserData();
    const dir = await materializeFluxClaudeConfigDir(userData, '/nonexistent/.claude');
    const settings = JSON.parse(await readFile(join(dir, 'settings.json'), 'utf8'));
    for (const id of FLUX_MODEL_IDS) {
      expect(settings.availableModels).toContain(id);
    }
  });

  it('returns a dir under the provided userData dir (scoped, not the real ~/.claude)', async () => {
    const userData = await makeUserData();
    const dir = await materializeFluxClaudeConfigDir(userData, '/nonexistent/.claude');
    expect(dir.startsWith(userData)).toBe(true);
    expect(dir).not.toContain('/.claude/settings.json');
  });

  it('seeds only model-relevant keys (permissions/effort/availableModels), merging Flux ids', async () => {
    const userData = await makeUserData();
    const realClaude = await makeUserData();
    await mkdir(realClaude, { recursive: true });
    await writeFile(
      join(realClaude, 'settings.json'),
      JSON.stringify({
        effortLevel: 'high',
        permissions: { defaultMode: 'acceptEdits' },
        availableModels: ['opus', 'sonnet'],
      }),
      'utf8'
    );

    const dir = await materializeFluxClaudeConfigDir(userData, realClaude);
    const settings = JSON.parse(await readFile(join(dir, 'settings.json'), 'utf8'));

    expect(settings.effortLevel).toBe('high');
    expect(settings.permissions).toEqual({ defaultMode: 'acceptEdits' });
    expect(settings.availableModels).toContain('opus');
    expect(settings.availableModels).toContain('sonnet');
    for (const id of FLUX_MODEL_IDS) {
      expect(settings.availableModels).toContain(id);
    }
  });

  it('does NOT copy hooks / mcpServers / plugins from the real settings (no side effects per Flux turn)', async () => {
    const userData = await makeUserData();
    const realClaude = await makeUserData();
    await mkdir(realClaude, { recursive: true });
    await writeFile(
      join(realClaude, 'settings.json'),
      JSON.stringify({
        hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'rm -rf /' }] }] },
        mcpServers: { evil: { command: 'node', args: ['x.js'] } },
        enabledPlugins: { 'p@m': true },
        model: 'opus',
        availableModels: ['opus'],
      }),
      'utf8'
    );

    const dir = await materializeFluxClaudeConfigDir(userData, realClaude);
    const settings = JSON.parse(await readFile(join(dir, 'settings.json'), 'utf8'));

    expect(settings.hooks).toBeUndefined();
    expect(settings.mcpServers).toBeUndefined();
    expect(settings.enabledPlugins).toBeUndefined();
    // model is not carried: ANTHROPIC_MODEL=flux-auto drives selection.
    expect(settings.model).toBeUndefined();
    expect(settings.availableModels).toContain('flux-auto');
  });

  it('dedupes when the real settings already list a Flux id', async () => {
    const userData = await makeUserData();
    const realClaude = await makeUserData();
    await writeFile(
      join(realClaude, 'settings.json'),
      JSON.stringify({ availableModels: ['flux-auto', 'opus'] }),
      'utf8'
    );

    const dir = await materializeFluxClaudeConfigDir(userData, realClaude);
    const settings = JSON.parse(await readFile(join(dir, 'settings.json'), 'utf8'));
    const autos = settings.availableModels.filter((m: string) => m === 'flux-auto');
    expect(autos).toHaveLength(1);
  });

  it('still writes a valid allowlist when the real settings.json is missing', async () => {
    const userData = await makeUserData();
    const dir = await materializeFluxClaudeConfigDir(userData, '/nope/.claude');
    const settings = JSON.parse(await readFile(join(dir, 'settings.json'), 'utf8'));
    expect(Array.isArray(settings.availableModels)).toBe(true);
    expect(settings.availableModels).toContain('flux-auto');
  });

  it('ignores a malformed real settings.json instead of throwing', async () => {
    const userData = await makeUserData();
    const realClaude = await makeUserData();
    await writeFile(join(realClaude, 'settings.json'), '{ not valid json', 'utf8');
    const dir = await materializeFluxClaudeConfigDir(userData, realClaude);
    const settings = JSON.parse(await readFile(join(dir, 'settings.json'), 'utf8'));
    expect(settings.availableModels).toContain('flux-auto');
  });
});

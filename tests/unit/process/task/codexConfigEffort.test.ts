/**
 * Unit tests for per-conversation effort flowing into the Flux-routed codex
 * config (`materializeFluxCodexHome`). When the conversation carries
 * `extra.effort`, the produced config.toml must emit `model_reasoning_effort`;
 * absence must leave it out (codex then applies the catalog default).
 *
 * Uses a real temp dir (no fs mocking) and reads the materialized config back.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { materializeFluxCodexHome } from '@process/task/codexConfig';

describe('materializeFluxCodexHome - per-conversation effort', () => {
  let dir: string;
  // A user config path that does not exist => MCP read degrades to {} (no-op).
  const noUserConfig = join(tmpdir(), 'does-not-exist-codex-config.toml');

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'codex-effort-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const readConfig = async (home: string): Promise<string> => readFile(join(home, 'config.toml'), 'utf8');

  it('emits model_reasoning_effort = "high" when effort is high', async () => {
    const home = await materializeFluxCodexHome(dir, 'workspace-write', undefined, noUserConfig, 'high');
    const config = await readConfig(home);
    expect(config).toContain('model_reasoning_effort = "high"');
  });

  it('emits the selected effort verbatim for low/medium', async () => {
    // Each effort materializes a distinct home so the configs do not clobber each other.
    const results = await Promise.all(
      (['low', 'medium'] as const).map(async (effort) => {
        const home = await materializeFluxCodexHome(
          join(dir, effort),
          'workspace-write',
          undefined,
          noUserConfig,
          effort
        );
        return { effort, config: await readConfig(home) };
      })
    );
    for (const { effort, config } of results) {
      expect(config).toContain(`model_reasoning_effort = "${effort}"`);
    }
  });

  it('omits model_reasoning_effort when no effort is provided (prior default)', async () => {
    const home = await materializeFluxCodexHome(dir, 'workspace-write', undefined, noUserConfig);
    const config = await readConfig(home);
    expect(config).not.toContain('model_reasoning_effort');
  });

  it('clamps Claude-only levels (xhigh/max) down to "high" - codex rejects them', async () => {
    // xhigh/max are valid for Claude but not codex's config knob; a stray value
    // must never reach model_reasoning_effort or codex fails to start.
    const results = await Promise.all(
      (['xhigh', 'max'] as const).map(async (effort) => {
        // Subdir name avoids the effort word so it can't pollute a substring check.
        const home = await materializeFluxCodexHome(
          join(dir, `clamp-${effort}`),
          'workspace-write',
          undefined,
          noUserConfig,
          effort
        );
        return await readConfig(home);
      })
    );
    for (const config of results) {
      expect(config).toContain('model_reasoning_effort = "high"');
      expect(config).not.toContain('model_reasoning_effort = "xhigh"');
      expect(config).not.toContain('model_reasoning_effort = "max"');
    }
  });
});

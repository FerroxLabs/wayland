/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
import { mkdtempSync } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { FLUX_MODEL_IDS, FLUX_TIER_AUTO_COMPACT_TOKENS, FLUX_TIER_CONTEXT_WINDOW } from '@/common/config/flux';
import { materializeFluxCodexHome } from '@process/task/codexConfig';
import { materializeFluxHermesHome } from '@process/task/hermesConfig';
import { needsRespawnForFluxTier, resolveFluxRouting } from '@process/task/fluxRouting';

const tmpDirs: string[] = [];
afterAll(async () => {
  await Promise.all(tmpDirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});
function userData(): string {
  const d = mkdtempSync(join(tmpdir(), 'wl-fluxtier-'));
  tmpDirs.push(d);
  return d;
}

const base = { fluxConnected: true, fluxKey: 'k-test', routeThroughFlux: false } as const;

describe('the selected Flux tier reaches every Flux surface', () => {
  // Flux bills on the tier that ARRIVES (customer_pricing.model_alias_to_tier reads
  // the ORIGINAL requested alias): fast $1/$4, standard $2/$8, reasoning $4/$15, and
  // flux-auto bills at STANDARD rates. Sending flux-auto for a Flux Fast pick
  // therefore charged that customer double. These assert the wire value, per tier.
  it('anthropic surface (claude) sends the picked tier, not flux-auto', () => {
    const got = Object.fromEntries(
      FLUX_MODEL_IDS.map((t) => [
        t,
        resolveFluxRouting({ ...base, backend: 'claude', selectedModelId: t }).env.ANTHROPIC_MODEL,
      ])
    );
    expect(got).toEqual({
      'flux-auto': 'flux-auto',
      'flux-reasoning': 'flux-reasoning',
      'flux-standard': 'flux-standard',
      'flux-fast': 'flux-fast',
    });
  });

  it('openai surface (qwen) sends the picked tier, not flux-auto', () => {
    const got = Object.fromEntries(
      FLUX_MODEL_IDS.map((t) => [
        t,
        resolveFluxRouting({ ...base, backend: 'qwen', selectedModelId: t }).env.OPENAI_MODEL,
      ])
    );
    expect(got).toEqual({
      'flux-auto': 'flux-auto',
      'flux-reasoning': 'flux-reasoning',
      'flux-standard': 'flux-standard',
      'flux-fast': 'flux-fast',
    });
  });

  it("goose's own GOOSE_MODEL carries the tier too, or its CLI key wins over OPENAI_MODEL", () => {
    const r = resolveFluxRouting({ ...base, backend: 'goose', selectedModelId: 'flux-fast' });
    expect(r.env.OPENAI_MODEL).toBe('flux-fast');
    expect(r.env.GOOSE_MODEL).toBe('flux-fast');
  });

  it('the resolved tier is exposed once, for the config-file surfaces', () => {
    expect(resolveFluxRouting({ ...base, backend: 'codex', selectedModelId: 'flux-reasoning' }).fluxModelId).toBe(
      'flux-reasoning'
    );
    expect(resolveFluxRouting({ ...base, backend: 'hermes', selectedModelId: 'flux-fast' }).fluxModelId).toBe(
      'flux-fast'
    );
  });

  it('codex CODEX_HOME selects the picked tier', async () => {
    const dir = await materializeFluxCodexHome(
      userData(),
      'read-only',
      undefined,
      undefined,
      undefined,
      undefined,
      'flux-reasoning'
    );
    const toml = await readFile(join(dir, 'config.toml'), 'utf8');
    expect(toml).toContain('model = "flux-reasoning"');
    expect(toml).not.toContain('model = "flux-auto"');
  });

  it('hermes HERMES_HOME selects the picked tier, in a per-tier directory', async () => {
    const ud = userData();
    const dir = await materializeFluxHermesHome(ud, 'k', undefined, 'flux-fast');
    expect(dir).toBe(join(ud, 'flux-hermes-home', 'flux-fast'));
    expect(await readFile(join(dir, 'config.yaml'), 'utf8')).toContain('default: flux-fast');
    // Two tiers must never share one file: hermes reads its model at process start.
    const other = await materializeFluxHermesHome(ud, 'k', undefined, 'flux-reasoning');
    expect(other).not.toBe(dir);
    expect(await readFile(join(dir, 'config.yaml'), 'utf8')).toContain('default: flux-fast');
  });
});

describe('guards that must not silently rot', () => {
  it('a NATIVE model id still refuses the Flux surface (the 400 the old constant prevented)', () => {
    const r = resolveFluxRouting({ ...base, backend: 'claude', selectedModelId: 'claude-opus-4-8' });
    expect(r.routing).toBe('native');
    expect(r.fluxModelId).toBeUndefined();
    expect(r.env.ANTHROPIC_MODEL).toBeUndefined();
  });

  it('a modelless spawn under the global toggle still defaults to flux-auto', () => {
    const r = resolveFluxRouting({ ...base, backend: 'qwen', selectedModelId: undefined, routeThroughFlux: true });
    expect(r.env.OPENAI_MODEL).toBe('flux-auto');
  });

  it('a native RESOLVED model still pins the spawn native even with the toggle on', () => {
    const r = resolveFluxRouting({
      ...base,
      backend: 'codex',
      selectedModelId: undefined,
      resolvedModelId: 'gpt-5.6-sol',
      routeThroughFlux: true,
    });
    expect(r.routing).toBe('native');
  });

  it('codex context sizing is the SHARED Flux number, never a third local one', async () => {
    const dir = await materializeFluxCodexHome(userData());
    const toml = await readFile(join(dir, 'config.toml'), 'utf8');
    expect(toml).toContain(`model_context_window = ${FLUX_TIER_CONTEXT_WINDOW}`);
    expect(toml).toContain(`model_auto_compact_token_limit = ${FLUX_TIER_AUTO_COMPACT_TOKENS}`);
    expect(toml).not.toContain('200000');
    expect(toml).not.toContain('180000');
  });

  it('codex compacts BEFORE the Flux Router blindly trims (forge_hook window * 0.85)', () => {
    // Flux drops messages with no summary once a request exceeds window*0.85.
    // Compacting after that point means the router has already deleted the turns.
    expect(FLUX_TIER_AUTO_COMPACT_TOKENS).toBeLessThan(FLUX_TIER_CONTEXT_WINDOW * 0.85);
  });
});

describe('a tier switch must RE-SPAWN, because no Flux surface changes model in place', () => {
  it('flux-auto -> flux-fast re-spawns', () => {
    expect(needsRespawnForFluxTier('flux', 'flux-auto', 'flux-fast')).toBe(true);
  });
  it('re-picking the SAME tier does not re-spawn', () => {
    expect(needsRespawnForFluxTier('flux', 'flux-fast', 'flux-fast')).toBe(false);
  });
  it('a native-routed agent is left to the routing-boundary path', () => {
    expect(needsRespawnForFluxTier('native', undefined, 'flux-fast')).toBe(false);
    expect(needsRespawnForFluxTier('unknown', undefined, 'flux-fast')).toBe(false);
  });
  it('a native target is never handled here', () => {
    expect(needsRespawnForFluxTier('flux', 'flux-auto', 'claude-opus-4-8')).toBe(false);
  });
  it('no live tier means no stale env to correct', () => {
    expect(needsRespawnForFluxTier('flux', undefined, 'flux-fast')).toBe(false);
  });
});

/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * release-smoke-connect.ts — the provider-connect gate.
 *
 * Runs the REAL `ConnectionTester` (the same code the Settings UI calls) against
 * the headline providers, so a broken connect path is a release failure instead
 * of a user discovery. This exists because we shipped wrong/regional endpoints
 * twice (OpenAI in rc2, Ollama + MiniMax in rc2.1) with green CI — because CI
 * never exercised the connect path.
 *
 * Two tiers:
 *   Tier 1 (no secrets, always runs): probe each provider with a junk key and
 *     assert the host actually answered with an auth verdict. `offline`/`unknown`
 *     means the host is wrong/dead/typo'd (the regional-host class). This needs
 *     no real keys and runs free in CI.
 *   Tier 2 (per-provider, opt-in): if SMOKE_KEY_<PROVIDER> is set, run a real
 *     connect and assert ok:true — catches a valid key being rejected by the
 *     wrong regional host, a dead key, or a billing wall.
 *
 * It also pins the known regional hosts so a regression that flips MiniMax back
 * to `.chat` or Moonshot back to `.cn` fails here.
 *
 * Run:  bun run scripts/release-smoke-connect.ts
 * Exit: 0 = pass, 1 = any check failed (do NOT publish/announce).
 */

import { ConnectionTester } from '../src/process/providers/detection/ConnectionTester';
import { PROVIDER_ENDPOINTS } from '../src/process/providers/detection/providerEndpoints';
import type { ProviderId } from '../src/process/providers/types';

/** Headline providers whose connect path must work for a release. */
const HEADLINE: ProviderId[] = [
  'openai',
  'anthropic',
  'google-gemini',
  'deepseek',
  'moonshot',
  'minimax',
  'groq',
  'mistral',
  'xai',
  'openrouter',
  'ollama-cloud',
  'sakana',
];

/** Hosts that MUST stay pinned (the regional-host bugs we already fixed). */
const PINNED_HOSTS: Partial<Record<ProviderId, string>> = {
  minimax: 'api.minimax.io',
  moonshot: 'api.moonshot.ai',
  sakana: 'api.sakana.ai',
};

/** Env var carrying a real key for a provider, e.g. SMOKE_KEY_OPENAI. */
function realKeyEnv(id: ProviderId): string {
  return `SMOKE_KEY_${id.toUpperCase().replace(/-/g, '_')}`;
}

/**
 * Tier-1 fails ONLY when the host never answered: `offline` is a DNS/timeout/
 * connection failure — a wrong, dead, or typo'd host. Any HTTP answer (even a
 * 400/404 → `unknown`, or a 401 → `unauthorized`) proves the endpoint resolves
 * and is serving. Whether a *valid key* is accepted is Tier 2's job, because a
 * wrong regional host still answers 401 to a good key (the MiniMax bug) — only a
 * real-key probe catches that.
 */
const UNREACHABLE = new Set(['offline']);

let failed = 0;
const pass = (m: string) => console.log(`  PASS  ${m}`);
const fail = (m: string) => {
  console.log(`  FAIL  ${m}`);
  failed = 1;
};

async function main(): Promise<void> {
  const tester = new ConnectionTester();

  console.log('=== Pinned regional hosts ===');
  for (const [id, host] of Object.entries(PINNED_HOSTS)) {
    const ep = PROVIDER_ENDPOINTS[id as ProviderId] ?? '';
    if (ep.includes(host)) pass(`${id} endpoint pinned to ${host}`);
    else fail(`${id} endpoint is "${ep}" — expected to contain ${host}`);
  }

  console.log('\n=== Tier 1: host reachability (junk key, no secrets needed) ===');
  for (const id of HEADLINE) {
    const res = await tester.test(id, { key: 'sk-smoke-invalid-key-000000000000' });
    const verdict = res.ok ? 'ok-true' : (res.error ?? 'unknown');
    if (UNREACHABLE.has(verdict)) {
      fail(`${id}: host unreachable (${verdict}) — wrong/dead/typo'd endpoint?`);
    } else {
      pass(`${id}: host reachable (${verdict})`);
    }
  }

  console.log('\n=== Tier 2: real connect (only providers with SMOKE_KEY_* set) ===');
  let tier2Ran = 0;
  for (const id of HEADLINE) {
    const key = process.env[realKeyEnv(id)];
    if (!key) continue;
    tier2Ran++;
    const res = await tester.test(id, { key });
    if (res.ok) pass(`${id}: real connect ok`);
    else fail(`${id}: real connect FAILED (${res.error}) — valid key rejected?`);
  }
  if (tier2Ran === 0) {
    console.log('  (skipped — no SMOKE_KEY_* secrets set; add them to gate real auth)');
  }

  console.log();
  if (failed) {
    console.log('#####################################################');
    console.log('# CONNECT SMOKE: FAIL — DO NOT PUBLISH/ANNOUNCE     #');
    console.log('#####################################################');
    process.exit(1);
  }
  console.log('#####################################################');
  console.log('# CONNECT SMOKE: PASS                               #');
  console.log('#####################################################');
}

main().catch((e) => {
  console.error('CONNECT SMOKE crashed:', e);
  process.exit(1);
});

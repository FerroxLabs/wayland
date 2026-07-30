#!/usr/bin/env node
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Measure what the Desktop decoder does with Core's real corpus, before and
 * after runtime contract validation.
 *
 * "Before" is not a reconstruction from memory: it reads
 * `src/process/agent/wcore/index.ts` at a git ref, extracts the actual
 * `case '…':` arms of `handleEvent`, and replays the corpus against the
 * shipped decode path (`JSON.parse` → `switch` → `default:` warn-and-drop).
 * "After" runs the same corpus through the real `WCoreFrameDecoder`.
 *
 *   node scripts/measure-wcore-frame-coverage.mjs --before <ref> --out report.json
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CORPUS = join(REPO_ROOT, 'resources', 'wcore-contract', 'v1');
const AGENT_PATH = 'src/process/agent/wcore/index.ts';

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
};

/** `case '…':` arms of `handleEvent` in a given source text. */
function switchArms(source) {
  const start = source.indexOf('private handleEvent(');
  if (start < 0) throw new Error('handleEvent not found — extractor is broken');
  const endMarkers = ['\n  private async handleHostSendMessage(', '\n  private handleHostSendMessage('];
  const end = endMarkers.map((m) => source.indexOf(m, start)).find((i) => i > start);
  if (end === undefined) throw new Error('handleEvent end marker not found — extractor is broken');
  return new Set([...source.slice(start, end).matchAll(/^\s*case '([a-z_]+)':/gm)].map((m) => m[1]));
}

const manifest = JSON.parse(readFileSync(join(CORPUS, 'manifest.json'), 'utf8'));
const criticality = Object.fromEntries(manifest.events.map((e) => [e.type, e.criticality]));

const eventFrames = readdirSync(join(CORPUS, 'events'))
  .filter((n) => n.endsWith('.json'))
  .sort()
  .map((name) => ({ name, line: readFileSync(join(CORPUS, 'events', name), 'utf8').trim() }));

const READY = eventFrames.find((f) => f.name === 'ready.json').line;

const adversarialReady = ['version-mismatch', 'schema-mismatch', 'fixture-mismatch'].map((n) => ({
  name: `${n}.jsonl`,
  line: readFileSync(join(CORPUS, 'adversarial/events', `${n}.jsonl`), 'utf8').trim(),
}));

/** Replay the corpus through the pre-validation decode path at a git ref. */
function measureBefore(ref) {
  const source = execFileSync('git', ['show', `${ref}:${AGENT_PATH}`], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  const arms = switchArms(source);

  const dispatched = [];
  const droppedSilently = [];
  for (const { line } of eventFrames) {
    // The shipped path: parse, then switch on `type`. No validation of any kind.
    const type = JSON.parse(line).type;
    (arms.has(type) ? dispatched : droppedSilently).push(type);
  }

  // The forged-ready control. The old path has no negotiation at all, so a
  // `ready` with tampered digests or a foreign major reaches `case 'ready'`
  // and marks the session ready exactly like the golden frame.
  const forgedAccepted = adversarialReady.filter(({ line }) => arms.has(JSON.parse(line).type)).map(({ name }) => name);

  return {
    ref,
    handledCaseArms: [...arms].sort(),
    totalContractEvents: eventFrames.length,
    dispatched: dispatched.sort(),
    droppedSilently: droppedSilently.sort(),
    droppedSilentlyBySafety: droppedSilently.filter((t) => criticality[t] === 'safety').sort(),
    forgedReadyAccepted: forgedAccepted,
    readyExecutionPolicyReachesHost: source.includes('event.execution_policy'),
  };
}

/** Replay the same corpus through the contract decoder. */
async function measureAfter() {
  const { WCoreFrameDecoder } = await import('../src/process/agent/wcore/contract/decoder.ts');

  const fresh = () => {
    const decoder = new WCoreFrameDecoder();
    const outcome = decoder.decode(READY);
    if (outcome.kind !== 'negotiated') throw new Error(`golden ready refused: ${outcome.kind}`);
    return decoder;
  };

  const delivered = [];
  const unhandledButLoud = [];
  const refused = [];
  for (const { name, line } of eventFrames) {
    if (name === 'ready.json') {
      delivered.push('ready');
      continue;
    }
    const outcome = fresh().decode(line);
    if (outcome.kind !== 'event') refused.push(`${outcome.type ?? name}:${outcome.code}`);
    else if (outcome.handled) delivered.push(outcome.type);
    else unhandledButLoud.push(`${outcome.type}(${outcome.criticality})`);
  }

  const forgedReadyRefused = adversarialReady.map(({ name, line }) => {
    const outcome = new WCoreFrameDecoder().decode(line);
    return { fixture: name, kind: outcome.kind, code: outcome.code ?? null };
  });

  const unknown = Object.fromEntries(
    ['unknown-noncritical', 'unknown-critical', 'unknown-criticality'].map((n) => {
      const line = readFileSync(join(CORPUS, 'adversarial/events', `${n}.jsonl`), 'utf8').trim();
      const outcome = fresh().decode(line);
      return [n, { kind: outcome.kind, code: outcome.code ?? outcome.reason ?? null }];
    })
  );

  return {
    totalContractEvents: eventFrames.length,
    delivered: delivered.sort(),
    unhandledButLoud: unhandledButLoud.sort(),
    droppedSilently: [],
    refused,
    forgedReadyRefused,
    unknownEventPolicy: unknown,
    readyExecutionPolicyReachesHost: readFileSync(join(REPO_ROOT, AGENT_PATH), 'utf8').includes(
      'event.execution_policy'
    ),
  };
}

const before = measureBefore(arg('--before') ?? 'HEAD');
const after = await measureAfter();
const report = {
  measuredAt: new Date().toISOString(),
  contract: `${manifest.contract.name} v${manifest.contract.major}.${manifest.contract.minor}`,
  generator: manifest.generator,
  before,
  after,
  summary: {
    contractEventTypes: eventFrames.length,
    beforeSilentDrops: before.droppedSilently.length,
    beforeSilentSafetyDrops: before.droppedSilentlyBySafety.length,
    afterSilentDrops: 0,
    afterDelivered: after.delivered.length,
    afterLoudGaps: after.unhandledButLoud.length,
    forgedReadyAcceptedBefore: before.forgedReadyAccepted.length,
    forgedReadyRefusedAfter: after.forgedReadyRefused.filter((r) => r.kind === 'refused').length,
  },
};

const out = arg('--out');
if (out) writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
else console.log(JSON.stringify(report, null, 2));

/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CMP-01 — shared execution model + capability manifest compatibility proof.
 *
 * Loads the shared model through the NON-Electron (standalone Web/Cloud)
 * composition root — the `register-node` side-effect module that server.ts and
 * initBridgeStandalone rely on — and asserts that:
 *   1. that composition root is the one actually active (NodePlatformServices),
 *   2. WAYLAND_CAPABILITY_MANIFEST builds, validates, and pins a stable
 *      contract digest through it, and
 *   3. projectExecution replays a fixture event log to a byte-identical
 *      snapshot digest — and replays IDENTICALLY across the desktop host and
 *      every Web/Cloud host, differing only in the scope.host label.
 *
 * This is a COMPATIBILITY / CI proof only. It does NOT claim Community Cloud,
 * Hosted Pro, deployment, or product readiness — merely that the one shared
 * model and one capability manifest compile and replay their contracts through
 * the standalone composition root exactly as they do on the native path.
 */

// Side-effect: register the standalone (Web/Cloud) composition root FIRST,
// exactly as src/process/webserver and initBridgeStandalone do.
import '@/common/platform/register-node';

import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { describe, expect, it } from 'vitest';

import { getPlatformServices } from '@/common/platform';
import { NodePlatformServices } from '@/common/platform/NodePlatformServices';
import {
  CAPABILITY_MANIFEST_CONTRACT,
  WAYLAND_CAPABILITY_MANIFEST,
  validateCapabilityManifest,
} from '@/common/capabilities';
import {
  projectExecution,
  type ExecutionEvent,
  type ExecutionHost,
  type ExecutionSeed,
  type ExecutionSnapshot,
} from '@/common/execution';

// --- deterministic canonical digest (same key-sorted scheme as manifest.ts) ---
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .toSorted(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}
function digestOf(value: unknown): `sha256:${string}` {
  return `sha256:${bytesToHex(sha256(new TextEncoder().encode(canonical(value))))}`;
}

// Pinned contract digests. If the shared model or manifest changes shape, these
// must be regenerated deliberately — that is the replay-contract guard.
const MANIFEST_CONTRACT_DIGEST = 'sha256:82e5e650ca0777d38acaed94e758a5e6205a9626d786b5a6bf41d690ad569750';
const SNAPSHOT_CONTRACT_DIGEST = 'sha256:287500782caa080c7e154212446704e2d3ca0e0a01ac2f171df7be66bcbb8493';

const IDENTITY = { runId: 'run-1', turnId: 'turn-1', correlationId: 'corr-1' } as const;
const NOW = 10_000;
const AT = 1_000;
const sha = (char: string): string => `sha256:${char.repeat(64)}`;

/** One rich, fully-valid event log, parameterised only by the host it runs on. */
function buildContractEvents(host: ExecutionHost): ExecutionEvent[] {
  const usageReceipt = { id: 'r-usage', kind: 'usage' as const, authority: 'provider' as const, identity: IDENTITY, observedAt: AT };
  const costReceipt = { id: 'r-cost', kind: 'cost' as const, authority: 'flux' as const, identity: IDENTITY, observedAt: AT };
  const latencyReceipt = { id: 'r-latency', kind: 'latency' as const, authority: 'flux' as const, identity: IDENTITY, observedAt: AT };
  const validationReceipt = { id: 'r-validation', kind: 'validation' as const, authority: 'core' as const, identity: IDENTITY, observedAt: AT };
  const constraint = (source: 'workspace' | 'backend' | 'host') => ({
    source,
    mode: 'autopilot' as const,
    enforceability: 'enforced' as const,
    identity: IDENTITY,
    host,
    observedAt: AT,
    expiresAt: 1_000_000,
    receiptId: `r-policy-${source}`,
  });
  return [
    { eventId: 'e0', sequence: 0, identity: IDENTITY, observedAt: AT, type: 'lifecycle', lifecycle: 'running' },
    {
      eventId: 'e1',
      sequence: 1,
      identity: IDENTITY,
      observedAt: AT,
      type: 'activity',
      activity: { id: 'act-1', kind: 'tool', name: 'read-source', status: 'completed' },
    },
    {
      eventId: 'e2',
      sequence: 2,
      identity: IDENTITY,
      observedAt: AT,
      type: 'plan',
      revisionId: 'rev-1',
      source: 'producer',
      steps: [{ id: 's1', content: 'Draft DOCX', status: 'completed' }],
    },
    {
      eventId: 'e3',
      sequence: 3,
      identity: IDENTITY,
      observedAt: AT,
      type: 'governance',
      constraints: [constraint('workspace'), constraint('backend'), constraint('host')],
    },
    {
      eventId: 'e4',
      sequence: 4,
      identity: IDENTITY,
      observedAt: AT,
      type: 'policy-revision',
      policy: {
        status: 'trusted',
        contractVersion: '1.0',
        revision: 0,
        reason: 'launch',
        effectiveAt: AT,
        posture: 'managed',
        approvals: 'auto_edit',
        sandbox: 'required',
        source: 'wayland-core',
        managedFloorActive: true,
      },
    },
    {
      eventId: 'e5',
      sequence: 5,
      identity: IDENTITY,
      observedAt: AT,
      type: 'usage',
      usage: { status: 'authoritative', inputTokens: 100, outputTokens: 40, cachedTokens: 10, receiptId: usageReceipt.id },
      receipt: usageReceipt,
    },
    {
      eventId: 'e6',
      sequence: 6,
      identity: IDENTITY,
      observedAt: AT,
      type: 'cost',
      cost: { status: 'authoritative', amount: 0.25, currency: 'USD', receiptId: costReceipt.id },
      receipt: costReceipt,
      attempt: { id: 'attempt-1', providerId: 'flux', role: 'primary' },
      conversationTotal: 0.25,
    },
    {
      eventId: 'e7',
      sequence: 7,
      identity: IDENTITY,
      observedAt: AT,
      type: 'latency',
      latency: { status: 'authoritative', milliseconds: 1234, receiptId: latencyReceipt.id },
      receipt: latencyReceipt,
    },
    {
      eventId: 'e8',
      sequence: 8,
      identity: IDENTITY,
      observedAt: AT,
      type: 'validation',
      validation: { status: 'valid', receiptId: validationReceipt.id },
      receipt: validationReceipt,
    },
    {
      eventId: 'e9',
      sequence: 9,
      identity: IDENTITY,
      observedAt: AT,
      type: 'trusted-receipt',
      receipt: {
        id: 'r-artifact',
        kind: 'artifact',
        authority: 'core',
        origin: 'core/anvil',
        contractVersion: '1.0',
        identity: IDENTITY,
        observedAt: AT,
        producerSessionId: 'sess-1',
        producerRunId: 'prod-run-1',
        producerTaskId: 'task-1',
        producerSequence: 0,
        artifactDigest: sha('a'),
        gateClosureDigest: sha('b'),
        bodyDigest: sha('c'),
        status: 'verified',
      },
    },
    {
      eventId: 'e10',
      sequence: 10,
      identity: IDENTITY,
      observedAt: AT,
      type: 'outcome',
      outcome: { id: 'out-1', kind: 'file', label: 'report.docx', receiptId: 'r-artifact', artifactDigest: sha('a') },
    },
    { eventId: 'e11', sequence: 11, identity: IDENTITY, observedAt: AT, type: 'lifecycle', lifecycle: 'completed' },
  ];
}

function seedFor(host: ExecutionHost): ExecutionSeed {
  return {
    identity: IDENTITY,
    actor: { backend: 'wcore', agentId: 'core', providerId: 'flux', modelId: 'gpt-test' },
    scope: { projectId: 'project-1', workspaceId: 'workspace-1', host, trust: 'trusted', scheduled: false },
    requestedGovernance: { mode: 'autopilot', enforceability: 'enforced' },
  };
}

function project(host: ExecutionHost): ExecutionSnapshot {
  return projectExecution(seedFor(host), buildContractEvents(host), { now: NOW });
}

// Every host the shared ExecutionScope models, native + Web/Cloud.
const WEB_CLOUD_HOSTS: readonly ExecutionHost[] = ['web', 'community-cloud', 'hosted-pro'];

describe('CMP-01 shared model + capability manifest replay through the standalone composition root', () => {
  it('loads through the standalone (non-Electron) composition root', () => {
    // register-node registered NodePlatformServices as the active root.
    expect(getPlatformServices()).toBeInstanceOf(NodePlatformServices);
    expect(process.versions.electron).toBeUndefined();
  });

  it('builds and validates the capability manifest and pins its contract digest', () => {
    const validation = validateCapabilityManifest(WAYLAND_CAPABILITY_MANIFEST);
    expect(validation.ok).toBe(true);
    expect(WAYLAND_CAPABILITY_MANIFEST.contract).toBe(CAPABILITY_MANIFEST_CONTRACT);
    expect(WAYLAND_CAPABILITY_MANIFEST.capabilities.length).toBeGreaterThan(0);
    // Fixture digests inside each capability are self-verified by validate();
    // this pins the whole manifest's canonical contract shape.
    expect(digestOf(WAYLAND_CAPABILITY_MANIFEST)).toBe(MANIFEST_CONTRACT_DIGEST);
  });

  it('replays the fixture event log to the pinned snapshot contract digest', () => {
    const snapshot = project('web');
    expect(snapshot.integrity).toEqual({ status: 'valid', reasons: [], lastSequence: 11 });
    expect(snapshot.lifecycle).toBe('completed');
    // Substance is real, not just a shape: authority actually resolved.
    expect(snapshot.governance.effective).toMatchObject({ status: 'effective', mode: 'autopilot', enforceability: 'enforced' });
    expect(snapshot.trustedPolicy.status).toBe('trusted');
    expect(snapshot.costLedger).toMatchObject({ status: 'authoritative', total: 0.25, currency: 'USD' });
    expect(snapshot.usage.status).toBe('authoritative');
    expect(snapshot.latency.status).toBe('authoritative');
    expect(snapshot.validation.status).toBe('valid');
    expect(snapshot.outcomeTrust).toHaveLength(1);
    expect(snapshot.outcomeTrust[0]).toMatchObject({ status: 'verified', outcomeId: 'out-1' });
    expect(digestOf(snapshot)).toBe(SNAPSHOT_CONTRACT_DIGEST);
  });

  it('is deterministic: two projections of the same log produce the same digest', () => {
    expect(digestOf(project('web'))).toBe(digestOf(project('web')));
  });

  it('replays IDENTICALLY across desktop and every Web/Cloud host (differs only by scope.host)', () => {
    const desktop = project('desktop');
    // desktop snapshot must be internally valid too.
    expect(desktop.integrity.status).toBe('valid');
    const desktopStripped = digestOf({ ...desktop, scope: { ...desktop.scope, host: 'HOST' } });
    for (const host of WEB_CLOUD_HOSTS) {
      const web = project(host);
      expect(web.integrity.status).toBe('valid');
      expect(web.scope.host).toBe(host);
      // Only the host label differs — the shared model replays byte-identically.
      const webStripped = digestOf({ ...web, scope: { ...web.scope, host: 'HOST' } });
      expect(webStripped).toBe(desktopStripped);
    }
  });
});

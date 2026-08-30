import { createHash, createPrivateKey, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  canonicalWaylandNanoBytes,
  WaylandNanoActivationBuilder,
} from '@process/agent/activation/waylandNanoActivation';
import type {
  WaylandNanoActivationRequest,
  WaylandNanoBinding,
  WaylandNanoSigner,
} from '@process/agent/activation/types';

const PRIVATE_KEY = createPrivateKey({
  key: Buffer.concat([
    Buffer.from('302e020100300506032b657004220420', 'hex'),
    Buffer.from(Array.from({ length: 32 }, (_, index) => index + 1)),
  ]),
  format: 'der',
  type: 'pkcs8',
});

const BINDING: WaylandNanoBinding = Object.freeze({
  productSubjectId: 'builtin-wayland-nano',
  principalId: 'main',
  projectId: 'project-018f',
  issuerId: 'desktop',
  issuerKeyRef: 'wayland-nano-key:v1:fixture',
  backend: 'wayland-nano',
});

const REQUEST: WaylandNanoActivationRequest = Object.freeze({
  logicalActivationId: 'act_fixture_01',
  sessionId: null,
  continuity: Object.freeze({ strategy: 'fresh', fallback: 'none', resume_fingerprint: null }),
  capabilities: Object.freeze(['filesystem.read', 'shell.execute']),
  budgets: Object.freeze({
    max_turns: 64,
    max_tool_calls: 256,
    max_input_tokens: 1_000_000,
    max_output_tokens: 250_000,
    max_cost_microcents: 100_000_000,
    wall_clock_ms: 3_600_000,
  }),
  deadline: '2026-08-29T11:00:00Z',
  issuedAt: '2026-08-29T10:00:00Z',
  notBefore: '2026-08-29T09:59:55Z',
  notAfter: '2026-08-29T10:05:00Z',
  controls: Object.freeze(['cancel', 'pause']),
});

const SIGNER: WaylandNanoSigner = Object.freeze({
  keyId: 'desktop-2026-01',
  sign: async (message) => sign(null, Buffer.from(message), PRIVATE_KEY),
});

describe('Wayland Nano activation producer', () => {
  it('matches the immutable Nano activation canonical bytes and signature', async () => {
    const ids = ['nonce_fixture_01', 'idem_fixture_01'];
    const builder = new WaylandNanoActivationBuilder({
      randomId: () => ids.shift()!,
      loadSigner: async () => SIGNER,
    });

    const activation = await builder.buildActivation(BINDING, REQUEST);
    const { signature, ...unsigned } = activation;

    expect(createHash('sha256').update(canonicalWaylandNanoBytes(unsigned)).digest('hex')).toBe(
      'a974ec611b59f42d756c5b85919158569fc83c5a85ad639a348fd3c0bba368a9'
    );
    expect(signature).toBe('RATpLIeYiK-GIx9anHUhEki7HScOkRnR5DtNPP2iQLEsxQ3IuluvymXV_wr2MEaqg80RdoWYvM_raoCgR6NNDg');
  });

  it('reuses exact replay identity for startup retries and rotates after terminal completion', async () => {
    const ids = ['nonce-1', 'idem-1', 'nonce-2', 'idem-2'];
    const builder = new WaylandNanoActivationBuilder({
      randomId: () => ids.shift()!,
      loadSigner: async () => SIGNER,
    });

    const first = await builder.buildActivation(BINDING, REQUEST);
    const retry = await builder.buildActivation(BINDING, { ...REQUEST, deadline: '2099-01-01T00:00:00Z' });
    builder.completeLogicalActivation(REQUEST.logicalActivationId);
    const next = await builder.buildActivation(BINDING, REQUEST);

    expect(retry).toBe(first);
    expect(next.nonce).not.toBe(first.nonce);
    expect(next.idempotency_key).not.toBe(first.idempotency_key);
  });

  it('domain-separates a signed cancel control from activation assertions', async () => {
    const builder = new WaylandNanoActivationBuilder({
      randomId: () => 'control_nonce_01',
      loadSigner: async () => SIGNER,
    });
    const control = await builder.buildControl({
      binding: BINDING,
      activationId: 'act_fixture_01',
      sessionId: 'session_fixture_01',
      control: 'cancel',
      issuedAt: '2026-08-29T10:00:02Z',
      notAfter: '2026-08-29T10:01:02Z',
    });

    expect(control.signature).toBe(
      'jeG8ryPbDuqhap6aY6DBb-e6DuSlVqsphSCeIwuvOCSlAqSkda-16Zi09qTRqmNWDMANzXhxzs0ehYWII7vtAg'
    );
  });
});

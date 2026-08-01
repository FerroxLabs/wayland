/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import type { TransferSnapshotObjectInput } from '@process/services/transfer/export';
import {
  aggregateTransferMutationEpoch,
  createTransferAuthorityCaptureBinding,
  runAcceptedTransferProducers,
  TransferProducerRunError,
  WAYLAND_TRANSFER_PRODUCER_REGISTRY,
  type TransferProducerCaptureResult,
  type TransferProducerRegistration,
} from '@process/services/transfer/producers';

const bytes = (value: string): Uint8Array => new TextEncoder().encode(value);
const capture = (
  objects: readonly TransferSnapshotObjectInput[],
  epoch = 'test-config:7'
): TransferProducerCaptureResult => ({
  objects,
  authorityBindings: [...new Set(objects.map(({ authorityId }) => authorityId))].map((authorityId) =>
    createTransferAuthorityCaptureBinding(authorityId, epoch, objects)
  ),
});
const accepted = (produce: TransferProducerRegistration['produce']): readonly TransferProducerRegistration[] => [
  { ...WAYLAND_TRANSFER_PRODUCER_REGISTRY[0], produce },
];

async function expectCode(promise: Promise<unknown>, code: TransferProducerRunError['code']): Promise<void> {
  const error = await promise.catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(TransferProducerRunError);
  expect(error).toMatchObject({ code });
}

const settingsObject = (value = 'portable settings'): TransferSnapshotObjectInput => ({
  key: 'settings',
  logicalStateId: 'desktop.preferences',
  authorityId: 'desktop.config',
  kind: 'state',
  provenance: 'snapshot-state',
  bytes: bytes(value),
});

describe('accepted transfer producer runner', () => {
  it('returns frozen objects, sorted authority evidence, and a deterministic aggregate epoch', async () => {
    const source = bytes('portable settings');
    const object = { ...settingsObject(), bytes: source };
    const produce = vi.fn(async () => capture([object]));
    const output = await runAcceptedTransferProducers({
      selectedLogicalState: ['desktop.preferences'],
      excludedLogicalState: [],
      registrations: accepted(produce),
    });

    source[0] ^= 0xff;
    expect(produce).toHaveBeenCalledOnce();
    expect(new TextDecoder().decode(output.objects[0].bytes)).toBe('portable settings');
    expect(output.mutationEpoch).toBe(aggregateTransferMutationEpoch(output.authorityBindings));
    expect(output.authorityBindings.map(({ authorityId }) => authorityId)).toEqual(['desktop.config']);
    expect(Object.isFrozen(output)).toBe(true);
    expect(Object.isFrozen(output.objects)).toBe(true);
    expect(Object.isFrozen(output.objects[0])).toBe(true);
    expect(Object.isFrozen(output.authorityBindings)).toBe(true);
    expect(Object.isFrozen(output.authorityBindings[0])).toBe(true);
  });

  it('supports multiple objects only under the producer declared authority', async () => {
    const objects = [
      { ...settingsObject('one'), key: 'settings-1' },
      { ...settingsObject('two'), key: 'settings-2', dependencyKeys: ['settings-1'] },
    ];
    const output = await runAcceptedTransferProducers({
      selectedLogicalState: ['desktop.preferences'],
      excludedLogicalState: [],
      registrations: accepted(async () => capture(objects)),
    });
    expect(output.objects.map(({ key }) => key)).toEqual(['settings-1', 'settings-2']);
    expect(output.authorityBindings).toHaveLength(1);
  });

  it('does not execute explicitly excluded families', async () => {
    const produce = vi.fn(async () => capture([settingsObject()]));
    const output = await runAcceptedTransferProducers({
      selectedLogicalState: ['desktop.preferences'],
      excludedLogicalState: ['desktop.preferences'],
      registrations: accepted(produce),
    });
    expect(output.objects).toEqual([]);
    expect(output.authorityBindings).toEqual([]);
    expect(output.mutationEpoch).toBe(aggregateTransferMutationEpoch([]));
    expect(produce).not.toHaveBeenCalled();
  });

  it('rejects unavailable families and invalid selection boundaries', async () => {
    await expectCode(
      runAcceptedTransferProducers({
        selectedLogicalState: ['desktop.chats-projects'],
        excludedLogicalState: [],
      }),
      'PRODUCER_UNAVAILABLE'
    );
    await expectCode(
      runAcceptedTransferProducers({
        selectedLogicalState: ['desktop.preferences'],
        excludedLogicalState: ['desktop.chats-projects'],
      }),
      'PRODUCER_SELECTION_INVALID'
    );
  });

  it('rejects empty, cross-family, wrong-authority, duplicate, and shared outputs', async () => {
    await expectCode(
      runAcceptedTransferProducers({
        selectedLogicalState: ['desktop.preferences'],
        excludedLogicalState: [],
        registrations: accepted(async () => ({ objects: [], authorityBindings: [] })),
      }),
      'PRODUCER_OUTPUT_INVALID'
    );
    const wrongFamily = { ...settingsObject(), logicalStateId: 'desktop.webui' as const };
    await expectCode(
      runAcceptedTransferProducers({
        selectedLogicalState: ['desktop.preferences'],
        excludedLogicalState: [],
        registrations: accepted(async () => capture([wrongFamily])),
      }),
      'PRODUCER_OUTPUT_INVALID'
    );
    const wrongAuthority = { ...settingsObject(), authorityId: 'desktop.database' as const };
    await expectCode(
      runAcceptedTransferProducers({
        selectedLogicalState: ['desktop.preferences'],
        excludedLogicalState: [],
        registrations: accepted(async () => capture([wrongAuthority])),
      }),
      'PRODUCER_OUTPUT_INVALID'
    );
    const duplicate = settingsObject('x');
    await expectCode(
      runAcceptedTransferProducers({
        selectedLogicalState: ['desktop.preferences'],
        excludedLogicalState: [],
        registrations: accepted(async () => capture([duplicate, duplicate])),
      }),
      'PRODUCER_OUTPUT_INVALID'
    );
    if (typeof SharedArrayBuffer !== 'undefined') {
      const shared = { ...duplicate, key: 'shared', bytes: new Uint8Array(new SharedArrayBuffer(1)) };
      await expectCode(
        runAcceptedTransferProducers({
          selectedLogicalState: ['desktop.preferences'],
          excludedLogicalState: [],
          registrations: accepted(async () => capture([shared])),
        }),
        'PRODUCER_OUTPUT_INVALID'
      );
    }
  });

  it('fails closed on missing, fake, duplicate, and conflicting authority evidence', async () => {
    const object = settingsObject();
    const valid = createTransferAuthorityCaptureBinding('desktop.config', 'test-config:7', [object]);
    const cases: Array<[TransferProducerCaptureResult, TransferProducerRunError['code']]> = [
      [{ objects: [object], authorityBindings: [] }, 'PRODUCER_AUTHORITY_EVIDENCE_MISSING'],
      [
        { objects: [object], authorityBindings: [{ ...valid, canonicalContentDigest: `sha256:${'0'.repeat(64)}` }] },
        'PRODUCER_AUTHORITY_CONTENT_MISMATCH',
      ],
      [{ objects: [object], authorityBindings: [valid, valid] }, 'PRODUCER_AUTHORITY_EVIDENCE_DUPLICATE'],
      [
        { objects: [object], authorityBindings: [valid, { ...valid, mutationEpoch: 'test-config:8' }] },
        'PRODUCER_AUTHORITY_EVIDENCE_CONFLICT',
      ],
    ];

    await Promise.all(
      cases.map(([result, code]) =>
        expectCode(
          runAcceptedTransferProducers({
            selectedLogicalState: ['desktop.preferences'],
            excludedLogicalState: [],
            registrations: accepted(async () => result),
          }),
          code
        )
      )
    );
  });

  it('rejects content mutation after authority evidence was captured', async () => {
    const object = settingsObject('before');
    const result = capture([object]);
    object.bytes.fill(0);
    await expectCode(
      runAcceptedTransferProducers({
        selectedLogicalState: ['desktop.preferences'],
        excludedLogicalState: [],
        registrations: accepted(async () => result),
      }),
      'PRODUCER_AUTHORITY_CONTENT_MISMATCH'
    );
  });

  it('normalizes producer exceptions without leaking their details', async () => {
    const secret = '/Users/alice/.config/wayland/provider-secret';
    const error = await runAcceptedTransferProducers({
      selectedLogicalState: ['desktop.preferences'],
      excludedLogicalState: [],
      registrations: accepted(async () => {
        throw new Error(secret);
      }),
    }).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ code: 'PRODUCER_EXECUTION_FAILED' });
    expect(String(error)).not.toContain(secret);
  });
});

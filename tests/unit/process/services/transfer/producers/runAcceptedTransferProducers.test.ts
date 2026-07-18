/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import {
  runAcceptedTransferProducers,
  TransferProducerRunError,
  WAYLAND_TRANSFER_PRODUCER_REGISTRY,
  type TransferProducerRegistration,
} from '@process/services/transfer/producers';

const bytes = (value: string): Uint8Array => new TextEncoder().encode(value);
const accepted = (produce: TransferProducerRegistration['produce']): readonly TransferProducerRegistration[] => [
  { ...WAYLAND_TRANSFER_PRODUCER_REGISTRY[0], produce },
];

async function expectCode(promise: Promise<unknown>, code: TransferProducerRunError['code']): Promise<void> {
  const error = await promise.catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(TransferProducerRunError);
  expect(error).toMatchObject({ code });
}

describe('accepted transfer producer runner', () => {
  it('runs an accepted producer and returns defensive immutable object bytes', async () => {
    const source = bytes('portable settings');
    const produce = vi.fn(async () => [
      {
        key: 'settings',
        logicalStateId: 'desktop.preferences' as const,
        authorityId: 'desktop.config' as const,
        kind: 'state' as const,
        provenance: 'snapshot-state' as const,
        bytes: source,
      },
    ]);
    const output = await runAcceptedTransferProducers({
      selectedLogicalState: ['desktop.preferences'],
      excludedLogicalState: [],
      registrations: accepted(produce),
    });

    source[0] ^= 0xff;
    expect(produce).toHaveBeenCalledOnce();
    expect(new TextDecoder().decode(output[0].bytes)).toBe('portable settings');
    expect(Object.isFrozen(output)).toBe(true);
    expect(Object.isFrozen(output[0])).toBe(true);
  });

  it('supports multiple objects for large state-family producers', async () => {
    const output = await runAcceptedTransferProducers({
      selectedLogicalState: ['desktop.preferences'],
      excludedLogicalState: [],
      registrations: accepted(async () => [
        {
          key: 'settings-1',
          logicalStateId: 'desktop.preferences',
          authorityId: 'desktop.config',
          kind: 'state',
          provenance: 'snapshot-state',
          bytes: bytes('one'),
        },
        {
          key: 'settings-2',
          logicalStateId: 'desktop.preferences',
          authorityId: 'desktop.runtime-files',
          kind: 'artifact',
          provenance: 'user-artifact',
          bytes: bytes('two'),
          dependencyKeys: ['settings-1'],
        },
      ]),
    });
    expect(output.map(({ key }) => key)).toEqual(['settings-1', 'settings-2']);
  });

  it('does not execute explicitly excluded families', async () => {
    const produce = vi.fn(async () => []);
    const output = await runAcceptedTransferProducers({
      selectedLogicalState: ['desktop.preferences'],
      excludedLogicalState: ['desktop.preferences'],
      registrations: accepted(produce),
    });
    expect(output).toEqual([]);
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
        registrations: accepted(async () => []),
      }),
      'PRODUCER_OUTPUT_INVALID'
    );
    await expectCode(
      runAcceptedTransferProducers({
        selectedLogicalState: ['desktop.preferences'],
        excludedLogicalState: [],
        registrations: accepted(async () => [
          {
            key: 'wrong-family',
            logicalStateId: 'desktop.webui',
            authorityId: 'desktop.config',
            kind: 'state',
            provenance: 'snapshot-state',
            bytes: bytes('x'),
          },
        ]),
      }),
      'PRODUCER_OUTPUT_INVALID'
    );
    await expectCode(
      runAcceptedTransferProducers({
        selectedLogicalState: ['desktop.preferences'],
        excludedLogicalState: [],
        registrations: accepted(async () => [
          {
            key: 'wrong-authority',
            logicalStateId: 'desktop.preferences',
            authorityId: 'desktop.database',
            kind: 'state',
            provenance: 'snapshot-state',
            bytes: bytes('x'),
          },
        ]),
      }),
      'PRODUCER_OUTPUT_INVALID'
    );
    const duplicate = {
      key: 'duplicate',
      logicalStateId: 'desktop.preferences' as const,
      authorityId: 'desktop.config' as const,
      kind: 'state' as const,
      provenance: 'snapshot-state' as const,
      bytes: bytes('x'),
    };
    await expectCode(
      runAcceptedTransferProducers({
        selectedLogicalState: ['desktop.preferences'],
        excludedLogicalState: [],
        registrations: accepted(async () => [duplicate, duplicate]),
      }),
      'PRODUCER_OUTPUT_INVALID'
    );
    if (typeof SharedArrayBuffer !== 'undefined') {
      await expectCode(
        runAcceptedTransferProducers({
          selectedLogicalState: ['desktop.preferences'],
          excludedLogicalState: [],
          registrations: accepted(async () => [
            { ...duplicate, key: 'shared', bytes: new Uint8Array(new SharedArrayBuffer(1)) },
          ]),
        }),
        'PRODUCER_OUTPUT_INVALID'
      );
    }
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

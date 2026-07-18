/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  resolveAcceptedTransferProducer,
  validateTransferProducerRegistry,
  WAYLAND_TRANSFER_PRODUCER_REGISTRY,
  WAYLAND_TRANSFER_PRODUCER_REGISTRY_ISSUES,
  type TransferProducerRegistration,
} from '@process/services/transfer/producers';

describe('Wayland transfer producer registry', () => {
  it('binds availability to a callable accepted output contract', async () => {
    expect(WAYLAND_TRANSFER_PRODUCER_REGISTRY_ISSUES).toEqual([]);
    const producer = resolveAcceptedTransferProducer('desktop.preferences', 'transfer.desktop-preferences-producer/v1');
    expect(producer).toMatchObject({
      logicalStateId: 'desktop.preferences',
      outputContract: 'wayland-transfer-desktop-preferences/1.0',
      outputSchemaVersion: 1,
    });
    expect(typeof producer?.produce).toBe('function');
  });

  it('rejects descriptor-only, wrong-id, and wrong-contract claims', () => {
    expect(resolveAcceptedTransferProducer('external.backend-handles', 'transfer.backend-reference-producer/v1')).toBe(
      undefined
    );
    expect(resolveAcceptedTransferProducer('desktop.preferences', 'transfer.lookalike/v1')).toBe(undefined);

    const accepted = WAYLAND_TRANSFER_PRODUCER_REGISTRY[0];
    const hostile = [
      { ...accepted, outputContract: 'wayland-transfer-desktop-preferences/9.9' },
    ] as readonly TransferProducerRegistration[];
    expect(validateTransferProducerRegistry(hostile).map(({ code }) => code)).toContain('PRODUCER_CONTRACT_UNACCEPTED');
    expect(
      resolveAcceptedTransferProducer('desktop.preferences', 'transfer.desktop-preferences-producer/v1', hostile)
    ).toBe(undefined);
  });

  it('rejects duplicate ids, duplicate logical state, and non-executable registrations', () => {
    const accepted = WAYLAND_TRANSFER_PRODUCER_REGISTRY[0];
    const hostile = [
      accepted,
      { ...accepted, produce: undefined },
    ] as unknown as readonly TransferProducerRegistration[];
    expect(validateTransferProducerRegistry(hostile).map(({ code }) => code)).toEqual(
      expect.arrayContaining(['PRODUCER_ID_DUPLICATE', 'PRODUCER_LOGICAL_STATE_DUPLICATE', 'PRODUCER_NOT_EXECUTABLE'])
    );
  });
});

/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { REQUIRED_LOGICAL_STATE } from '@process/services/recovery/recoveryManifest';
import {
  WAYLAND_PORTABILITY_REGISTRY,
  unavailableTransferProducers,
  validatePortabilityRegistry,
  type PortabilityDescriptor,
} from '@process/services/transfer/registry';

describe('Wayland portability registry', () => {
  it('accounts for every durable logical state exactly once', () => {
    const result = validatePortabilityRegistry(WAYLAND_PORTABILITY_REGISTRY);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.descriptors.map(({ logicalStateId }) => logicalStateId).toSorted()).toEqual(
      REQUIRED_LOGICAL_STATE.toSorted()
    );
  });

  it('keeps incomplete producers machine-visible instead of claiming export readiness', () => {
    const issues = unavailableTransferProducers(REQUIRED_LOGICAL_STATE);
    expect(issues.map(({ logicalStateId }) => logicalStateId)).toEqual(
      expect.arrayContaining([
        'desktop.chats-projects',
        'desktop.scheduler',
        'desktop.workflows-teams',
        'core.engine-state',
        'credentials.secrets',
      ])
    );
    expect(issues.map(({ logicalStateId }) => logicalStateId)).toEqual(
      expect.arrayContaining(['external.backend-handles', 'updater.release-channel', 'external.workspaces'])
    );
    expect(issues.map(({ logicalStateId }) => logicalStateId)).not.toContain('desktop.preferences');
  });

  it('accepts desktop preferences only through its executable producer', () => {
    expect(unavailableTransferProducers(['desktop.preferences'])).toEqual([]);
    expect(
      WAYLAND_PORTABILITY_REGISTRY.find(({ logicalStateId }) => logicalStateId === 'desktop.preferences')?.producer
    ).toEqual({ id: 'transfer.desktop-preferences-producer/v1', state: 'available' });
  });

  it('rejects selected scopes that omit a registered dependency', () => {
    expect(unavailableTransferProducers(['external.workspaces'])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'REGISTRY_DEPENDENCY_OUT_OF_SCOPE',
          logicalStateId: 'external.workspaces',
        }),
      ])
    );
  });

  it('rejects missing, duplicate, unknown-authority, unsafe-limit, and cyclic descriptors', () => {
    const first = WAYLAND_PORTABILITY_REGISTRY[0];
    const hostile = [
      ...WAYLAND_PORTABILITY_REGISTRY.slice(0, -1),
      first,
      {
        ...first,
        logicalStateId: 'desktop.scheduler',
        authorityIds: ['future.authority'],
        dependencies: ['desktop.scheduler'],
        maxObjectBytes: Number.MAX_SAFE_INTEGER,
      },
    ] as unknown as PortabilityDescriptor[];
    const result = validatePortabilityRegistry(hostile);
    expect(result.valid).toBe(false);
    expect(result.issues.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'REGISTRY_LOGICAL_STATE_MISSING',
        'REGISTRY_DUPLICATE_LOGICAL_STATE',
        'REGISTRY_AUTHORITY_UNKNOWN',
        'REGISTRY_DEPENDENCY_SELF',
        'REGISTRY_OBJECT_LIMIT_INVALID',
        'REGISTRY_DEPENDENCY_CYCLE',
      ])
    );
  });

  it('rejects credential reconnect descriptors that do not redact secrets', () => {
    const descriptors = [...WAYLAND_PORTABILITY_REGISTRY];
    const credentialIndex = descriptors.findIndex(({ logicalStateId }) => logicalStateId === 'credentials.secrets');
    descriptors[credentialIndex] = { ...descriptors[credentialIndex], secretPolicy: 'encrypted' };
    expect(validatePortabilityRegistry(descriptors).issues.map(({ code }) => code)).toContain(
      'REGISTRY_RECONNECT_SECRET_POLICY_INVALID'
    );
  });
});

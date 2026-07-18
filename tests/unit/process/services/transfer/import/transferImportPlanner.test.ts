/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import { buildTransferObjectGraph, type TransferObjectGraph } from '@process/services/transfer/export';
import {
  planTransferImport,
  TRANSFER_IMPORT_NON_CLAIM,
  type PlanTransferImportInput,
  type TransferImportDestination,
  type TransferImportRequestedDecision,
} from '@process/services/transfer/import';
import { WAYLAND_PORTABILITY_REGISTRY } from '@process/services/transfer/registry';

const text = (value: string): Uint8Array => new TextEncoder().encode(value);
const digest = (character: string) => `sha256:${character.repeat(64)}` as const;
const destinationId = (character: string) => `wdi1:${character.repeat(64)}`;

const sourceCompatibility = {
  application: 'Wayland' as const,
  appVersion: '0.11.18',
  releaseTrack: 'stable' as const,
  desktopSchemaVersion: 42,
  platform: 'darwin' as const,
  arch: 'arm64' as const,
  minimumReaderFormat: 1 as const,
  maximumReaderFormat: 1 as const,
};

const destination = (overrides: Partial<TransferImportDestination> = {}): TransferImportDestination => ({
  instanceId: 'destination-one',
  compatibility: {
    minimumFormat: 1,
    maximumFormat: 1,
    minimumDesktopSchemaVersion: 40,
    maximumDesktopSchemaVersion: 50,
    acceptedReleaseTracks: ['stable', 'preview'],
  },
  existingObjects: [],
  ...overrides,
});

const preferencesGraph = (payload = 'private preference bytes'): TransferObjectGraph =>
  buildTransferObjectGraph({
    sourceCompatibility,
    selectedLogicalState: ['desktop.preferences'],
    exclusions: [],
    objects: [
      {
        key: 'preferences',
        logicalStateId: 'desktop.preferences',
        authorityId: 'desktop.config',
        kind: 'state',
        provenance: 'snapshot-state',
        bytes: text(payload),
      },
    ],
  });

const executableGraph = (): TransferObjectGraph =>
  buildTransferObjectGraph({
    sourceCompatibility,
    selectedLogicalState: ['desktop.chats-projects', 'desktop.scheduler'],
    exclusions: [],
    objects: [
      {
        key: 'chats',
        logicalStateId: 'desktop.chats-projects',
        authorityId: 'desktop.database',
        kind: 'state',
        provenance: 'snapshot-state',
        bytes: text('chats'),
      },
      {
        key: 'schedule',
        logicalStateId: 'desktop.scheduler',
        authorityId: 'desktop.database',
        kind: 'state',
        provenance: 'snapshot-state',
        bytes: text('schedule'),
        dependencyKeys: ['chats'],
      },
    ],
  });

const receiptGraph = (): TransferObjectGraph =>
  buildTransferObjectGraph({
    sourceCompatibility,
    selectedLogicalState: ['desktop.artifacts-receipts', 'desktop.chats-projects'],
    exclusions: [],
    objects: [
      {
        key: 'chats',
        logicalStateId: 'desktop.chats-projects',
        authorityId: 'desktop.database',
        kind: 'state',
        provenance: 'snapshot-state',
        bytes: text('chats'),
      },
      {
        key: 'receipt',
        logicalStateId: 'desktop.artifacts-receipts',
        authorityId: 'desktop.runtime-files',
        kind: 'receipt',
        provenance: 'authoritative-receipt',
        bytes: text('{"cost":"4.25","secret":"never summarize me"}'),
        dependencyKeys: ['chats'],
      },
    ],
  });

const input = (graph: TransferObjectGraph, target = destination()): PlanTransferImportInput => ({
  graph,
  destination: target,
  idempotencyKey: 'owner-approved-import-1',
});

function mutateManifest(
  graph: TransferObjectGraph,
  mutate: (manifest: Record<string, unknown>) => void
): TransferObjectGraph {
  const manifest = JSON.parse(new TextDecoder().decode(graph.manifestBytes)) as Record<string, unknown>;
  mutate(manifest);
  return { ...graph, manifestBytes: text(JSON.stringify(manifest)) };
}

describe('transfer transactional import dry-run planner', () => {
  it('builds a deterministic content-free plan without claiming mutation', () => {
    const graph = preferencesGraph();
    const first = planTransferImport(input(graph));
    const second = planTransferImport(input(graph));

    expect(second).toEqual(first);
    expect(first.objectDecisions).toHaveLength(1);
    expect(first.objectDecisions[0]).toMatchObject({
      conflictDecision: 'create',
      activation: 'inactive',
      handling: 'portable',
      preserveSourceBytes: true,
      preserveSourceId: false,
    });
    expect(first.objectDecisions[0].destinationObjectId).toMatch(/^wdi1:[a-f0-9]{64}$/);
    expect(first.blockers).toEqual([{ code: 'CONSUMER_UNAVAILABLE', logicalStateId: 'desktop.preferences' }]);
    expect(first.readyForTransactionalApply).toBe(false);
    expect(first.nonClaim).toBe(TRANSFER_IMPORT_NON_CLAIM);
    expect(JSON.stringify(first.summary)).not.toContain('private preference bytes');
    expect(JSON.stringify(first.summary)).not.toContain('owner-approved-import-1');
  });

  it('maps dependencies to destination IDs and keeps executable families paused', () => {
    const plan = planTransferImport(input(executableGraph()));
    const schedule = plan.objectDecisions.find(({ logicalStateId }) => logicalStateId === 'desktop.scheduler')!;
    const chats = plan.objectDecisions.find(({ logicalStateId }) => logicalStateId === 'desktop.chats-projects')!;

    expect(schedule.activation).toBe('paused-review');
    expect(schedule.destinationDependencies).toEqual([chats.destinationObjectId]);
    expect(schedule.destinationDependencies).not.toContain(chats.sourceObjectId);
  });

  it('rejects executable activation assertions instead of widening them', () => {
    const graph = executableGraph();
    const plan = planTransferImport(input(graph));
    const schedule = plan.objectDecisions.find(({ logicalStateId }) => logicalStateId === 'desktop.scheduler')!;
    const hostile = {
      sourceObjectId: schedule.sourceObjectId,
      destinationObjectId: schedule.destinationObjectId,
      conflictDecision: schedule.conflictDecision,
      activation: 'active',
    } as unknown as TransferImportRequestedDecision;

    expect(() => planTransferImport({ ...input(graph), requestedDecisions: [hostile] })).toThrow(
      `requested decision widens policy for ${schedule.sourceObjectId}`
    );
  });

  it('preserves source receipt bytes, IDs, and digests and rejects rewrite attempts', () => {
    const graph = receiptGraph();
    const plan = planTransferImport(input(graph));
    const sourceReceipt = graph.manifest.objects.find(({ kind }) => kind === 'receipt')!;
    const receipt = plan.objectDecisions.find(({ kind }) => kind === 'receipt')!;

    expect(receipt).toMatchObject({
      sourceObjectId: sourceReceipt.id,
      destinationObjectId: sourceReceipt.id,
      sourceSha256: sourceReceipt.sha256,
      sourceByteLength: sourceReceipt.byteLength,
      sourceImmutableBytes: true,
      preserveSourceBytes: true,
      preserveSourceId: true,
      handling: 'immutable-receipt',
    });
    expect(JSON.stringify(plan.summary)).not.toContain('4.25');
    const rewrite: TransferImportRequestedDecision = {
      sourceObjectId: receipt.sourceObjectId,
      destinationObjectId: destinationId('a'),
      conflictDecision: 'replace',
      activation: receipt.activation,
    };
    expect(() => planTransferImport({ ...input(graph), requestedDecisions: [rewrite] })).toThrow(
      `requested decision widens policy for ${receipt.sourceObjectId}`
    );
  });

  it('rejects an occupied immutable receipt ID with conflicting provenance', () => {
    const graph = receiptGraph();
    const receipt = graph.manifest.objects.find(({ kind }) => kind === 'receipt')!;
    expect(() =>
      planTransferImport(
        input(
          graph,
          destination({
            existingObjects: [
              {
                destinationObjectId: receipt.id,
                logicalStateId: receipt.logicalStateId,
                kind: receipt.kind,
                sha256: digest('f'),
              },
            ],
          })
        )
      )
    ).toThrow(`immutable receipt ${receipt.id} conflicts at destination`);
  });

  it('supports exact skip, registry merge, and registry replace without policy widening', () => {
    const graph = preferencesGraph();
    const initial = planTransferImport(input(graph));
    const source = graph.manifest.objects[0];
    const targetId = initial.objectDecisions[0].destinationObjectId;
    const exact = destination({
      existingObjects: [
        {
          destinationObjectId: targetId,
          logicalStateId: source.logicalStateId,
          kind: source.kind,
          sha256: source.sha256,
          sourceObjectId: source.id,
        },
      ],
    });
    expect(planTransferImport(input(graph, exact)).objectDecisions[0].conflictDecision).toBe('skip');

    const mergeTarget = destination({
      existingObjects: [
        {
          destinationObjectId: targetId,
          logicalStateId: source.logicalStateId,
          kind: source.kind,
          sha256: digest('1'),
        },
      ],
    });
    const mergePlan = planTransferImport(input(graph, mergeTarget));
    expect(mergePlan.objectDecisions[0].conflictDecision).toBe('merge');
    const widening: TransferImportRequestedDecision = {
      sourceObjectId: source.id,
      destinationObjectId: targetId,
      conflictDecision: 'replace',
      activation: 'inactive',
    };
    expect(() => planTransferImport({ ...input(graph, mergeTarget), requestedDecisions: [widening] })).toThrow(
      'requested decision widens policy'
    );

    const webui = buildTransferObjectGraph({
      sourceCompatibility,
      selectedLogicalState: ['desktop.webui'],
      exclusions: [],
      objects: [
        {
          key: 'webui',
          logicalStateId: 'desktop.webui',
          authorityId: 'desktop.config',
          kind: 'state',
          provenance: 'snapshot-state',
          bytes: text('web ui configuration'),
        },
      ],
    });
    const webuiInitial = planTransferImport(input(webui));
    const webuiSource = webui.manifest.objects[0];
    const replaceTarget = destination({
      existingObjects: [
        {
          destinationObjectId: webuiInitial.objectDecisions[0].destinationObjectId,
          logicalStateId: webuiSource.logicalStateId,
          kind: webuiSource.kind,
          sha256: digest('2'),
        },
      ],
    });
    expect(planTransferImport(input(webui, replaceTarget)).objectDecisions[0].conflictDecision).toBe('replace');
  });

  it('uses a sealed policy snapshot rather than a mutable registry reference', () => {
    const graph = preferencesGraph();
    const initial = planTransferImport(input(graph));
    const source = graph.manifest.objects[0];
    const target = destination({
      existingObjects: [
        {
          destinationObjectId: initial.objectDecisions[0].destinationObjectId,
          logicalStateId: source.logicalStateId,
          kind: source.kind,
          sha256: digest('7'),
        },
      ],
    });
    const descriptor = WAYLAND_PORTABILITY_REGISTRY.find(
      ({ logicalStateId }) => logicalStateId === 'desktop.preferences'
    )!;
    const original = descriptor.conflictPolicy;
    descriptor.conflictPolicy = 'replace';
    try {
      expect(planTransferImport(input(graph, target)).objectDecisions[0].conflictDecision).toBe('merge');
    } finally {
      descriptor.conflictPolicy = original;
    }
  });

  it('fails closed on collision aliasing and duplicate destination IDs', () => {
    const graph = preferencesGraph();
    const initial = planTransferImport(input(graph));
    const source = graph.manifest.objects[0];
    const base = {
      logicalStateId: source.logicalStateId,
      kind: source.kind,
      sha256: source.sha256,
      sourceObjectId: source.id,
    };
    expect(() =>
      planTransferImport(
        input(
          graph,
          destination({
            existingObjects: [
              { destinationObjectId: initial.objectDecisions[0].destinationObjectId, ...base },
              { destinationObjectId: destinationId('b'), ...base },
            ],
          })
        )
      )
    ).toThrow('aliases multiple destination objects');
    expect(() =>
      planTransferImport(
        input(
          graph,
          destination({
            existingObjects: [
              { destinationObjectId: destinationId('c'), ...base },
              { destinationObjectId: destinationId('c'), ...base, sourceObjectId: undefined },
            ],
          })
        )
      )
    ).toThrow('duplicate destination object');
  });

  it('keeps credentials reconnect-only and external handles reference-only', () => {
    const graph = buildTransferObjectGraph({
      sourceCompatibility,
      selectedLogicalState: ['credentials.secrets', 'external.backend-handles'],
      exclusions: [
        {
          logicalStateId: 'credentials.secrets',
          disposition: 'reconnect-required',
          reasonCode: 'CREDENTIAL_RECONNECT_REQUIRED',
        },
      ],
      objects: [
        {
          key: 'backend',
          logicalStateId: 'external.backend-handles',
          authorityId: 'external.agent-configs',
          kind: 'reference',
          provenance: 'external-reference',
          bytes: text('opaque external reference'),
        },
      ],
    });
    const plan = planTransferImport(input(graph));

    expect(plan.familyDecisions).toEqual([
      { logicalStateId: 'credentials.secrets', action: 'reconnect', executable: false },
    ]);
    expect(plan.objectDecisions[0]).toMatchObject({
      handling: 'external-reference',
      activation: 'paused-review',
    });
    expect(plan.summary).toMatchObject({ reconnectFamilyCount: 1, externalReferenceCount: 1 });
  });

  it('accepts only an identical idempotent repeat and rejects graph or plan drift', () => {
    const graph = preferencesGraph();
    const first = planTransferImport(input(graph));
    const prior = {
      idempotencyKeySha256: first.idempotencyKeySha256,
      destinationInstanceId: first.destinationInstanceId,
      semanticGraphSha256: first.semanticGraphSha256,
      planSha256: first.planSha256,
    };
    expect(planTransferImport({ ...input(graph), priorBindings: [prior] }).repeat).toBe('identical');
    expect(() =>
      planTransferImport({ ...input(preferencesGraph('changed source graph')), priorBindings: [prior] })
    ).toThrow('idempotency key is already bound to a different graph or destination');
    expect(() =>
      planTransferImport({ ...input(graph), priorBindings: [{ ...prior, planSha256: digest('d') }] })
    ).toThrow('idempotent repeat conflicts with the previously sealed plan');
  });

  it('revalidates the authenticated graph and rejects dependency gaps and unknown families', () => {
    const graph = executableGraph();
    const missingDependency = mutateManifest(graph, (manifest) => {
      const objects = manifest.objects as Array<Record<string, unknown>>;
      const schedule = objects.find(({ logicalStateId }) => logicalStateId === 'desktop.scheduler')!;
      schedule.dependencies = [`wto1:${'e'.repeat(64)}`];
    });
    expect(() => planTransferImport(input(missingDependency))).toThrow('unknown dependency');

    const unknownFamily = mutateManifest(preferencesGraph(), (manifest) => {
      manifest.selectedLogicalState = ['future.unknown'];
    });
    expect(() => planTransferImport(input(unknownFamily))).toThrow('unknown selected family');
  });

  it('rejects support-receipt drift and incompatible destinations', () => {
    const graph = preferencesGraph();
    expect(() =>
      planTransferImport(input({ ...graph, supportReceipt: { ...graph.supportReceipt, objectCount: 99 } }))
    ).toThrow('source graph support receipt does not bind the validated graph');
    expect(() =>
      planTransferImport(
        input(
          graph,
          destination({
            compatibility: {
              minimumFormat: 1,
              maximumFormat: 1,
              minimumDesktopSchemaVersion: 43,
              maximumDesktopSchemaVersion: 50,
              acceptedReleaseTracks: ['stable'],
            },
          })
        )
      )
    ).toThrow('desktop schema 42 is outside destination compatibility');

    const forgedView = {
      ...graph,
      manifest: {
        ...graph.manifest,
        sourceCompatibility: { ...graph.manifest.sourceCompatibility, desktopSchemaVersion: 49 },
      },
    };
    expect(() =>
      planTransferImport(
        input(
          forgedView,
          destination({
            compatibility: {
              minimumFormat: 1,
              maximumFormat: 1,
              minimumDesktopSchemaVersion: 49,
              maximumDesktopSchemaVersion: 50,
              acceptedReleaseTracks: ['stable'],
            },
          })
        )
      )
    ).toThrow('desktop schema 42 is outside destination compatibility');
  });
});

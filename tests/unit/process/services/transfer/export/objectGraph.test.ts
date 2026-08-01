/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import {
  buildTransferObjectGraph,
  parseAndValidateTransferObjectGraph,
  type BuildTransferObjectGraphInput,
  type TransferObjectGraph,
} from '@process/services/transfer/export';

const text = (value: string): Uint8Array => new TextEncoder().encode(value);

const baseInput = (): BuildTransferObjectGraphInput => ({
  sourceCompatibility: {
    application: 'Wayland',
    appVersion: '0.11.18',
    releaseTrack: 'stable',
    desktopSchemaVersion: 42,
    platform: 'darwin',
    arch: 'arm64',
    minimumReaderFormat: 1,
    maximumReaderFormat: 1,
  },
  selectedLogicalState: ['desktop.artifacts-receipts', 'desktop.chats-projects', 'credentials.secrets'],
  exclusions: [
    {
      logicalStateId: 'credentials.secrets',
      disposition: 'reconnect-required',
      reasonCode: 'CREDENTIAL_RECONNECT_REQUIRED',
    },
  ],
  objects: [
    {
      key: 'database',
      logicalStateId: 'desktop.chats-projects',
      authorityId: 'desktop.database',
      kind: 'state',
      provenance: 'snapshot-state',
      bytes: text('snapshot bytes'),
    },
    {
      key: 'provider-receipt',
      logicalStateId: 'desktop.artifacts-receipts',
      authorityId: 'desktop.runtime-files',
      kind: 'receipt',
      provenance: 'authoritative-receipt',
      bytes: text('{"observed_cost":"1.25","secret":"not metadata"}'),
      dependencyKeys: ['database'],
    },
  ],
});

const decode = (graph: TransferObjectGraph): string => new TextDecoder().decode(graph.manifestBytes);

type MutableObjectDescriptor = {
  id: string;
  ordinal: number;
  kind: string;
  authorityId?: string;
  dependencies: string[];
  [key: string]: unknown;
};

type MutableManifest = {
  objects: MutableObjectDescriptor[];
  [key: string]: unknown;
};

function mutateManifest(graph: TransferObjectGraph, mutate: (manifest: MutableManifest) => void): Uint8Array {
  const manifest = JSON.parse(decode(graph)) as MutableManifest;
  mutate(manifest);
  return text(JSON.stringify(manifest));
}

describe('transfer inner manifest object graph', () => {
  it('builds a canonical content-addressed graph and validates every stored byte', () => {
    const graph = buildTransferObjectGraph(baseInput());

    expect(graph.manifest.bundleId).toMatch(/^wtb1:[a-f0-9]{64}$/);
    expect(graph.manifest.resumability).toMatchObject({
      strategy: 'ordinal-content-addressed-v1',
      objectCount: 2,
      terminalOrdinal: 1,
    });
    expect(graph.manifest.objects.map((object) => object.ordinal)).toEqual([0, 1]);
    expect(graph.manifest.objects.map((object) => object.id)).toEqual(
      graph.manifest.objects.map((object) => object.id).toSorted()
    );
    expect(graph.manifest.selectedLogicalState).toEqual([...baseInput().selectedLogicalState].toSorted());
    expect(parseAndValidateTransferObjectGraph(graph.manifestBytes, graph.objects)).toEqual(graph.manifest);
  });

  it('is deterministic across construction order and construction-local key names', () => {
    const first = buildTransferObjectGraph(baseInput());
    const input = baseInput();
    const renamed: BuildTransferObjectGraphInput = {
      ...input,
      selectedLogicalState: [...input.selectedLogicalState].toReversed(),
      objects: [
        { ...input.objects[1], key: 'receipt-renamed', dependencyKeys: ['state-renamed'] },
        { ...input.objects[0], key: 'state-renamed' },
      ],
    };
    const second = buildTransferObjectGraph(renamed);

    expect(second.manifestBytes).toEqual(first.manifestBytes);
    expect(second.supportReceipt).toEqual(first.supportReceipt);
  });

  it('preserves authoritative receipt bytes exactly and exposes only content-free support evidence', () => {
    const input = baseInput();
    const original = Uint8Array.from(input.objects[1].bytes);
    const graph = buildTransferObjectGraph(input);
    const receipt = graph.manifest.objects.find((object) => object.kind === 'receipt')!;

    expect(receipt).toMatchObject({
      provenance: 'authoritative-receipt',
      immutableBytes: true,
      byteLength: original.byteLength,
    });
    expect(graph.objects.get(receipt.id)).toEqual(original);
    input.objects[1].bytes[0] ^= 0xff;
    expect(graph.objects.get(receipt.id)).toEqual(original);

    const support = JSON.stringify(graph.supportReceipt);
    expect(support).not.toContain('observed_cost');
    expect(support).not.toContain('secret');
    expect(support).not.toContain('/Users/');
    expect(decode(graph)).not.toContain('observed_cost');
  });

  it('accounts for every selected family exactly once as objects or an exclusion', () => {
    const input = baseInput();
    expect(() =>
      buildTransferObjectGraph({
        ...input,
        selectedLogicalState: [...input.selectedLogicalState, 'desktop.scheduler'],
      })
    ).toThrow('selected family desktop.scheduler is unaccounted');
    expect(() =>
      buildTransferObjectGraph({
        ...input,
        exclusions: [
          ...input.exclusions,
          {
            logicalStateId: 'desktop.chats-projects',
            disposition: 'excluded',
            reasonCode: 'POLICY_EXCLUDED',
          },
        ],
      })
    ).toThrow('excluded family desktop.chats-projects contains objects');
  });

  it('rejects missing dependencies, duplicate dependencies, cycles, and semantic collisions', () => {
    const input = baseInput();
    expect(() =>
      buildTransferObjectGraph({
        ...input,
        objects: [{ ...input.objects[0], dependencyKeys: ['missing'] }, input.objects[1]],
      })
    ).toThrow('unknown dependency missing');
    expect(() =>
      buildTransferObjectGraph({
        ...input,
        objects: [input.objects[0], { ...input.objects[1], dependencyKeys: ['database', 'database'] }],
      })
    ).toThrow('duplicate dependencies');
    expect(() =>
      buildTransferObjectGraph({
        ...input,
        objects: [{ ...input.objects[0], dependencyKeys: ['provider-receipt'] }, input.objects[1]],
      })
    ).toThrow('dependency cycle');
    expect(() =>
      buildTransferObjectGraph({
        ...input,
        objects: [input.objects[0], { ...input.objects[0], key: 'database-copy' }, input.objects[1]],
      })
    ).toThrow('semantic object collision');
  });

  it('enforces receipt provenance and does not allow receipt claims on other object kinds', () => {
    const input = baseInput();
    expect(() =>
      buildTransferObjectGraph({
        ...input,
        objects: [input.objects[0], { ...input.objects[1], provenance: 'snapshot-state' }],
      })
    ).toThrow('receipt objects require receipt provenance');
    expect(() =>
      buildTransferObjectGraph({
        ...input,
        objects: [{ ...input.objects[0], provenance: 'authoritative-receipt' }, input.objects[1]],
      })
    ).toThrow('receipt provenance may only classify receipt objects');
  });

  it('enforces registry authority, disposition, and family dependency policy', () => {
    const input = baseInput();
    expect(() =>
      buildTransferObjectGraph({
        ...input,
        objects: [{ ...input.objects[0], authorityId: 'updater.state' }, input.objects[1]],
      })
    ).toThrow('authority updater.state cannot represent desktop.chats-projects');
    expect(() =>
      buildTransferObjectGraph({
        ...input,
        exclusions: [
          {
            ...input.exclusions[0],
            disposition: 'excluded',
            reasonCode: 'POLICY_EXCLUDED',
          },
        ],
      })
    ).toThrow('must use the reconnect-required credential exclusion');
    expect(() =>
      buildTransferObjectGraph({
        ...input,
        objects: [input.objects[0], { ...input.objects[1], dependencyKeys: [] }],
      })
    ).toThrow('desktop.artifacts-receipts has no object dependency on desktop.chats-projects');

    const referenceInput: BuildTransferObjectGraphInput = {
      ...input,
      selectedLogicalState: ['external.backend-handles'],
      exclusions: [],
      objects: [
        {
          key: 'backend-handle',
          logicalStateId: 'external.backend-handles',
          authorityId: 'external.agent-configs',
          kind: 'state',
          provenance: 'snapshot-state',
          bytes: text('opaque handle'),
        },
      ],
    };
    expect(() => buildTransferObjectGraph(referenceInput)).toThrow('may contain reference objects only');
  });

  it('rejects duplicate JSON keys and unknown or missing critical fields', () => {
    const graph = buildTransferObjectGraph(baseInput());
    const canonical = decode(graph);
    expect(() =>
      parseAndValidateTransferObjectGraph(
        canonical.replace(
          '"contract":"wayland-transfer-inner-manifest/1.0"',
          '"contract":"wayland-transfer-inner-manifest/1.0","contract":"wayland-transfer-inner-manifest/1.0"'
        ),
        graph.objects
      )
    ).toThrow('duplicate object key');
    expect(() =>
      parseAndValidateTransferObjectGraph(
        mutateManifest(graph, (manifest) => {
          manifest.criticalFuture = true;
        }),
        graph.objects
      )
    ).toThrow('unknown critical manifest field criticalFuture');
    expect(() =>
      parseAndValidateTransferObjectGraph(
        mutateManifest(graph, (manifest) => {
          delete manifest.objects[0].authorityId;
        }),
        graph.objects
      )
    ).toThrow('missing critical object field authorityId');
  });

  it('rejects noncanonical metadata, unknown references, and duplicate ordinals', () => {
    const graph = buildTransferObjectGraph(baseInput());
    expect(() => parseAndValidateTransferObjectGraph(` ${decode(graph)}`, graph.objects)).toThrow(
      'manifest JSON is not canonical'
    );
    expect(() =>
      parseAndValidateTransferObjectGraph(
        mutateManifest(graph, (manifest) => {
          manifest.objects[0].dependencies = [`wto1:${'f'.repeat(64)}`];
        }),
        graph.objects
      )
    ).toThrow('unknown dependency');
    expect(() =>
      parseAndValidateTransferObjectGraph(
        mutateManifest(graph, (manifest) => {
          manifest.objects[1].ordinal = manifest.objects[0].ordinal;
        }),
        graph.objects
      )
    ).toThrow('duplicate object ordinal');
  });

  it('fails closed on missing, extra, length-mismatched, or digest-mismatched payloads', () => {
    const graph = buildTransferObjectGraph(baseInput());
    const first = graph.manifest.objects[0];
    const missing = new Map(graph.objects);
    missing.delete(first.id);
    expect(() => parseAndValidateTransferObjectGraph(graph.manifestBytes, missing)).toThrow('missing bytes');

    const extra = new Map<string, Uint8Array>(graph.objects);
    extra.set(`wto1:${'f'.repeat(64)}`, text('extra'));
    expect(() => parseAndValidateTransferObjectGraph(graph.manifestBytes, extra)).toThrow('unreferenced object bytes');

    const short = new Map(graph.objects);
    short.set(first.id, text('x'));
    expect(() => parseAndValidateTransferObjectGraph(graph.manifestBytes, short)).toThrow('byte length mismatch');

    const sameLength = new Map(graph.objects);
    sameLength.set(first.id, new Uint8Array(first.byteLength).fill(0x78));
    expect(() => parseAndValidateTransferObjectGraph(graph.manifestBytes, sameLength)).toThrow(
      'content digest mismatch'
    );

    const wrongType = new Map<string, Uint8Array>(graph.objects);
    wrongType.set(first.id, 'not bytes' as unknown as Uint8Array);
    expect(() => parseAndValidateTransferObjectGraph(graph.manifestBytes, wrongType)).toThrow(
      'bytes must be a Uint8Array'
    );
  });

  it('recomputes content-addressed object identities instead of trusting manifest claims', () => {
    const graph = buildTransferObjectGraph(baseInput());
    const replacementId = `wto1:${'f'.repeat(64)}`;
    const target = graph.manifest.objects.find((object) => object.kind === 'receipt')!;
    const objects = new Map<string, Uint8Array>(graph.objects);
    objects.set(replacementId, objects.get(target.id)!);
    objects.delete(target.id);
    expect(() =>
      parseAndValidateTransferObjectGraph(
        mutateManifest(graph, (manifest) => {
          manifest.objects.find((object) => object.kind === 'receipt')!.id = replacementId;
          manifest.objects.sort((left, right) => left.id.localeCompare(right.id));
          manifest.objects.forEach((object, ordinal) => {
            object.ordinal = ordinal;
          });
        }),
        objects
      )
    ).toThrow('content-addressed id mismatch');
  });

  it('recomputes semantic, resumability, and bundle identities', () => {
    const graph = buildTransferObjectGraph(baseInput());
    expect(() =>
      parseAndValidateTransferObjectGraph(
        mutateManifest(graph, (manifest) => {
          manifest.bundleId = `wtb1:${'f'.repeat(64)}`;
        }),
        graph.objects
      )
    ).toThrow('bundle id mismatch');
    expect(() =>
      parseAndValidateTransferObjectGraph(
        mutateManifest(graph, (manifest) => {
          const resumability = manifest.resumability as Record<string, unknown>;
          resumability.totalBytes = (resumability.totalBytes as number) + 1;
        }),
        graph.objects
      )
    ).toThrow('resumability totalBytes mismatch');
    expect(() =>
      parseAndValidateTransferObjectGraph(
        mutateManifest(graph, (manifest) => {
          const resumability = manifest.resumability as Record<string, unknown>;
          resumability.semanticGraphSha256 = `sha256:${'f'.repeat(64)}`;
        }),
        graph.objects
      )
    ).toThrow('semantic graph digest mismatch');
  });

  it('rejects compatibility drift, arbitrary exclusion prose, unsafe local keys, and empty scope', () => {
    const input = baseInput();
    expect(() =>
      buildTransferObjectGraph({
        ...input,
        sourceCompatibility: { ...input.sourceCompatibility, appVersion: '/Users/sean/secret' },
      })
    ).toThrow('appVersion is invalid');
    expect(() =>
      buildTransferObjectGraph({
        ...input,
        exclusions: [
          {
            ...input.exclusions[0],
            reasonCode: '/Users/sean/secret' as (typeof input.exclusions)[number]['reasonCode'],
          },
        ],
      })
    ).toThrow('unknown exclusion reason');
    expect(() =>
      buildTransferObjectGraph({
        ...input,
        objects: [{ ...input.objects[0], key: '/Users/sean/database' }, input.objects[1]],
      })
    ).toThrow('unsafe construction key');
    expect(() => buildTransferObjectGraph({ ...input, selectedLogicalState: [], exclusions: [], objects: [] })).toThrow(
      'must not be empty'
    );
  });
});

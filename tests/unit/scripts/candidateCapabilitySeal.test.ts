import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const { CONTRACT, RECEIPT_CONTRACT, createCapabilitySeal, sha256, verifyCapabilitySeal } =
  require('../../../scripts/capability-seal/verifyCandidateCapabilitySeal') as {
    CONTRACT: string;
    RECEIPT_CONTRACT: string;
    createCapabilitySeal: (options: Record<string, unknown>) => Record<string, unknown>;
    sha256: (value: string | Buffer) => string;
    verifyCapabilitySeal: (seal: unknown) => unknown;
  };

const COMMIT = 'a'.repeat(40);
const TREE = 'b'.repeat(40);
const ACCEPTED_COMMIT = 'd'.repeat(40);
const ACCEPTED_TREE = 'e'.repeat(40);
const PACKETS = new Map<string, string[]>([
  ['cowork-office', ['C0-B', 'C1']],
  ['voice', ['M5V-A']],
  ['mcp', ['M1M', 'MCP-4']],
  ['sandbox', ['M1S', 'SBX-2']],
  ['flux', ['M1F']],
]);
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'wayland-capability-seal-'));
  const receiptsDir = join(root, 'receipts');
  mkdirSync(receiptsDir);
  roots.push(root);
  const capabilities = [...PACKETS].map(([id, packets]) => {
    const receipt = {
      contract: RECEIPT_CONTRACT,
      capabilityId: id,
      packets,
      status: 'accepted',
      acceptedCommit: ACCEPTED_COMMIT,
      acceptedTree: ACCEPTED_TREE,
      proof: [`sha256:${'c'.repeat(64)}`],
    };
    const bytes = `${JSON.stringify(receipt, null, 2)}\n`;
    writeFileSync(join(receiptsDir, `${id}.json`), bytes);
    return {
      id,
      packets,
      mode: 'included',
      receiptSha256: sha256(bytes),
      excludedPaths: [`surfaces/${id}`],
    };
  });
  return {
    root,
    receiptsDir,
    selection: { contract: CONTRACT, capabilities },
    candidate: {
      commit: COMMIT,
      tree: TREE,
      status: '',
      ancestors: [ACCEPTED_COMMIT],
      acceptedTrees: { [ACCEPTED_COMMIT]: ACCEPTED_TREE },
    },
  };
}

describe('candidate capability seal', () => {
  it('seals the exact candidate only when every required receipt is accepted', () => {
    const input = fixture();
    const seal = createCapabilitySeal(input);

    expect(seal).toMatchObject({
      contract: 'wayland-candidate-capability-seal/1.0',
      candidate: { commit: COMMIT, tree: TREE },
    });
    expect((seal.capabilities as unknown[]).length).toBe(5);
    expect(verifyCapabilitySeal(seal)).toBe(seal);
  });

  it('fails closed when an included capability has no pinned receipt digest', () => {
    const input = fixture();
    input.selection.capabilities[0].receiptSha256 = null as unknown as string;

    expect(() => createCapabilitySeal(input)).toThrow(/no exact accepted receipt digest/);
  });

  it('rejects a receipt for a sibling or stale candidate', () => {
    const input = fixture();
    const receiptFile = join(input.receiptsDir, 'mcp.json');
    const receipt = {
      contract: RECEIPT_CONTRACT,
      capabilityId: 'mcp',
      packets: ['M1M', 'MCP-4'],
      status: 'accepted',
      acceptedCommit: 'f'.repeat(40),
      acceptedTree: ACCEPTED_TREE,
      proof: [`sha256:${'c'.repeat(64)}`],
    };
    const bytes = `${JSON.stringify(receipt, null, 2)}\n`;
    writeFileSync(receiptFile, bytes);
    input.selection.capabilities.find((entry) => entry.id === 'mcp')!.receiptSha256 = sha256(bytes);
    input.candidate.acceptedTrees[receipt.acceptedCommit] = receipt.acceptedTree;

    expect(() => createCapabilitySeal(input)).toThrow(/source not present in this candidate/);
  });

  it('rejects a receipt whose accepted tree does not belong to its accepted commit', () => {
    const input = fixture();
    input.candidate.acceptedTrees[ACCEPTED_COMMIT] = 'f'.repeat(40);

    expect(() => createCapabilitySeal(input)).toThrow(/commit\/tree identity does not exist or match/);
  });

  it('rejects receipt bytes that disagree with the pinned digest', () => {
    const input = fixture();
    writeFileSync(join(input.receiptsDir, 'voice.json'), '{}\n');

    expect(() => createCapabilitySeal(input)).toThrow(/digest mismatch for voice/);
  });

  it('accepts exclusion only when every declared source and resource path is absent', () => {
    const input = fixture();
    const voice = input.selection.capabilities.find((entry) => entry.id === 'voice')!;
    voice.mode = 'excluded';
    voice.receiptSha256 = null as unknown as string;
    mkdirSync(join(input.root, 'surfaces', 'voice'), { recursive: true });

    expect(() => createCapabilitySeal(input)).toThrow(/marked excluded but remains physically present/);
  });

  it('rejects tampering with the packaged seal', () => {
    const input = fixture();
    const seal = createCapabilitySeal(input);
    const tampered = structuredClone(seal) as { capabilities: Array<{ acceptedCommit: string }> };
    tampered.capabilities[0].acceptedCommit = 'f'.repeat(40);

    expect(() => verifyCapabilitySeal(tampered)).toThrow(/seal digest mismatch/);
  });

  it('rejects unknown critical fields inside a packaged capability', () => {
    const input = fixture();
    const seal = createCapabilitySeal(input);
    const tampered = structuredClone(seal) as { capabilities: Array<Record<string, unknown>> };
    tampered.capabilities[0].grantsRelease = true;

    expect(() => verifyCapabilitySeal(tampered)).toThrow(/invalid critical fields/);
  });

  it('rejects unknown critical selection fields and incomplete capability coverage', () => {
    const input = fixture();
    const unknown = { ...input.selection, authorizesRelease: true };
    expect(() => createCapabilitySeal({ ...input, selection: unknown })).toThrow(/unknown critical fields/);

    input.selection.capabilities.pop();
    expect(() => createCapabilitySeal(input)).toThrow(/coverage is incomplete/);
  });
});

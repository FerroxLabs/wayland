import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const { CONTRACT, RECEIPT_CONTRACT, capabilitySourceDigest, createCapabilitySeal, sha256, verifyCapabilitySeal } =
  require('../../../scripts/capability-seal/verifyCandidateCapabilitySeal') as {
    CONTRACT: string;
    RECEIPT_CONTRACT: string;
    capabilitySourceDigest: (root: string, commit: string, capabilityId: string) => string;
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
const MANIFEST_EXCLUSIONS = new Map<string, string[]>(
  (
    JSON.parse(readFileSync(join(process.cwd(), 'scripts/capability-seal/candidate-capabilities.json'), 'utf8')) as {
      capabilities: Array<{ id: string; excludedPaths: string[] }>;
    }
  ).capabilities.map(({ id, excludedPaths }) => [id, excludedPaths])
);
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
    const sourceSha256 = sha256(`source:${id}`);
    const receipt = {
      contract: RECEIPT_CONTRACT,
      capabilityId: id,
      packets,
      status: 'accepted',
      acceptedCommit: ACCEPTED_COMMIT,
      acceptedTree: ACCEPTED_TREE,
      sourceSha256,
      proof: [`sha256:${'c'.repeat(64)}`],
    };
    const bytes = `${JSON.stringify(receipt, null, 2)}\n`;
    writeFileSync(join(receiptsDir, `${id}.json`), bytes);
    return {
      id,
      packets,
      mode: 'included',
      receiptSha256: sha256(bytes),
      excludedPaths: MANIFEST_EXCLUSIONS.get(id)!,
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
      sourceDigests: {
        [ACCEPTED_COMMIT]: Object.fromEntries([...PACKETS].map(([id]) => [id, sha256(`source:${id}`)])),
        [COMMIT]: Object.fromEntries([...PACKETS].map(([id]) => [id, sha256(`source:${id}`)])),
      },
    },
  };
}

function git(root: string, ...args: string[]): string {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
}

function commit(root: string, message: string): string {
  git(root, 'add', '.');
  git(root, 'commit', '-m', message);
  return git(root, 'rev-parse', 'HEAD');
}

function realGitFixture() {
  const tempRoot = mkdtempSync(join(tmpdir(), 'wayland-capability-source-'));
  const root = join(tempRoot, 'repo');
  const receiptsDir = join(tempRoot, 'receipts');
  mkdirSync(root);
  mkdirSync(receiptsDir);
  roots.push(tempRoot);
  git(root, 'init', '--quiet');
  git(root, 'config', 'user.email', 'capability-seal@example.test');
  git(root, 'config', 'user.name', 'Capability Seal Test');
  const mcpFile = join(root, 'src/process/services/mcpServices/McpService.ts');
  mkdirSync(dirname(mcpFile), { recursive: true });
  writeFileSync(mcpFile, 'export const version = 1;\n');
  const acceptedCommit = commit(root, 'accepted capability source');
  const acceptedTree = git(root, 'rev-parse', 'HEAD^{tree}');
  const capabilities = [...PACKETS].map(([id, packets]) => {
    const receipt = {
      contract: RECEIPT_CONTRACT,
      capabilityId: id,
      packets,
      status: 'accepted',
      acceptedCommit,
      acceptedTree,
      sourceSha256: capabilitySourceDigest(root, acceptedCommit, id),
      proof: [`sha256:${'c'.repeat(64)}`],
    };
    const bytes = `${JSON.stringify(receipt, null, 2)}\n`;
    writeFileSync(join(receiptsDir, `${id}.json`), bytes);
    return {
      id,
      packets,
      mode: 'included',
      receiptSha256: sha256(bytes),
      excludedPaths: MANIFEST_EXCLUSIONS.get(id)!,
    };
  });
  return {
    root,
    receiptsDir,
    selection: { contract: CONTRACT, capabilities },
    mcpFile,
  };
}

describe('candidate capability seal', () => {
  it('seals the exact candidate only when every required receipt is accepted', () => {
    const input = fixture();
    const seal = createCapabilitySeal(input);

    expect(seal).toMatchObject({
      contract: 'wayland-candidate-capability-seal/2.0',
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
      sourceSha256: sha256('source:mcp'),
      proof: [`sha256:${'c'.repeat(64)}`],
    };
    const bytes = `${JSON.stringify(receipt, null, 2)}\n`;
    writeFileSync(receiptFile, bytes);
    input.selection.capabilities.find((entry) => entry.id === 'mcp')!.receiptSha256 = sha256(bytes);
    input.candidate.acceptedTrees[receipt.acceptedCommit] = receipt.acceptedTree;
    input.candidate.sourceDigests[receipt.acceptedCommit] = { mcp: receipt.sourceSha256 };

    expect(() => createCapabilitySeal(input)).toThrow(/source not present in this candidate/);
  });

  it('rejects a receipt whose accepted tree does not belong to its accepted commit', () => {
    const input = fixture();
    input.candidate.acceptedTrees[ACCEPTED_COMMIT] = 'f'.repeat(40);

    expect(() => createCapabilitySeal(input)).toThrow(/commit\/tree identity does not exist or match/);
  });

  it('rejects a receipt source digest that does not match its accepted commit', () => {
    const input = fixture();
    const receiptFile = join(input.receiptsDir, 'mcp.json');
    const receipt = JSON.parse(readFileSync(receiptFile, 'utf8')) as Record<string, unknown>;
    receipt.sourceSha256 = sha256('forged accepted source');
    const bytes = `${JSON.stringify(receipt, null, 2)}\n`;
    writeFileSync(receiptFile, bytes);
    input.selection.capabilities.find((entry) => entry.id === 'mcp')!.receiptSha256 = sha256(bytes);

    expect(() => createCapabilitySeal(input)).toThrow(/does not bind its accepted capability source/);
  });

  it('rejects a legacy receipt missing the source digest critical field', () => {
    const input = fixture();
    const receiptFile = join(input.receiptsDir, 'mcp.json');
    const receipt = JSON.parse(readFileSync(receiptFile, 'utf8')) as Record<string, unknown>;
    delete receipt.sourceSha256;
    const bytes = `${JSON.stringify(receipt, null, 2)}\n`;
    writeFileSync(receiptFile, bytes);
    input.selection.capabilities.find((entry) => entry.id === 'mcp')!.receiptSha256 = sha256(bytes);

    expect(() => createCapabilitySeal(input)).toThrow(/invalid contract or critical fields/);
  });

  it('rejects receipt bytes that disagree with the pinned digest', () => {
    const input = fixture();
    writeFileSync(join(input.receiptsDir, 'voice.json'), '{}\n');

    expect(() => createCapabilitySeal(input)).toThrow(/digest mismatch for voice/);
  });

  it('keeps an ancestor receipt valid across an unrelated successor commit', () => {
    const input = realGitFixture();
    const unrelated = join(input.root, 'docs/unrelated.md');
    mkdirSync(dirname(unrelated), { recursive: true });
    writeFileSync(unrelated, 'unrelated successor\n');
    commit(input.root, 'unrelated successor');

    expect(() => createCapabilitySeal(input)).not.toThrow();
  });

  it('rejects an ancestor receipt after a capability-owned source changes', () => {
    const input = realGitFixture();
    writeFileSync(input.mcpFile, 'export const version = 2;\n');
    commit(input.root, 'regress accepted mcp source');

    expect(() => createCapabilitySeal(input)).toThrow(/Capability mcp source changed after its accepted receipt/);
  });

  it('rejects a selection that omits any authoritative exclusion path', () => {
    const input = fixture();
    const voice = input.selection.capabilities.find((entry) => entry.id === 'voice')!;
    voice.mode = 'excluded';
    voice.receiptSha256 = null as unknown as string;
    voice.excludedPaths = voice.excludedPaths.slice(1);

    expect(() => createCapabilitySeal(input)).toThrow(/physical exclusion inventory does not match authority/);
  });

  it.each([
    ['cowork-office', 'src/process/bridge/officecliInstaller.ts', 'src/process/bridge/officecliInstaller.ts'],
    ['voice', 'src/process/bridge/voiceSynthBridge.ts', 'src/process/bridge/voiceSynthBridge.ts'],
    ['mcp', 'src/process/services/mcpServices/McpService.ts', 'src/process/services/mcpServices'],
    ['sandbox', 'src/process/team/sandbox/workspaceFs.ts', 'src/process/team/sandbox'],
    ['flux', 'src/process/task/fluxRouting.ts', 'src/process/task/fluxRouting.ts'],
  ])(
    'rejects excluded %s when implementation remains at %s',
    (capabilityId, implementationPath, expectedInventoryPath) => {
      const input = fixture();
      const capability = input.selection.capabilities.find((entry) => entry.id === capabilityId)!;
      capability.mode = 'excluded';
      capability.receiptSha256 = null as unknown as string;
      const absolutePath = join(input.root, implementationPath);
      mkdirSync(dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, '// hostile retained implementation\n');

      expect(() => createCapabilitySeal(input)).toThrow(
        new RegExp(`Capability ${capabilityId} is marked excluded.*${expectedInventoryPath.replaceAll('/', '\\/')}`)
      );
    }
  );

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

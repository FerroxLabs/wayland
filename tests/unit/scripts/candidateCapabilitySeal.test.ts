import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const {
  CONTRACT,
  PROOF_CONTRACT,
  RECEIPT_CONTRACT,
  RECEIPT_MANIFEST_CONTRACT,
  SUITES,
  capabilitySourceDigest,
  createCapabilitySeal,
  selectionDigest,
  sha256,
  verifyCapabilitySeal,
} = require('../../../scripts/capability-seal/verifyCandidateCapabilitySeal') as {
  CONTRACT: string;
  PROOF_CONTRACT: string;
  RECEIPT_CONTRACT: string;
  RECEIPT_MANIFEST_CONTRACT: string;
  SUITES: Record<string, string[]>;
  capabilitySourceDigest: (root: string, commit: string, capabilityId: string) => string;
  createCapabilitySeal: (options: Record<string, unknown>) => Record<string, unknown>;
  selectionDigest: (selection: unknown) => string;
  sha256: (value: string | Buffer) => string;
  verifyCapabilitySeal: (seal: unknown) => unknown;
};

const COMMIT = 'a'.repeat(40);
const TREE = 'b'.repeat(40);
const TRUST_COMMIT = 'f'.repeat(40);
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

function writeProofAuthority(
  receiptsDir: string,
  id: string,
  candidate: { commit: string; tree: string },
  sourceSha256: string
): Record<string, string> {
  const logFile = `${id}.proof.log`;
  const logBytes = `canonical output:${id}\n`;
  const logSha256 = sha256(logBytes);
  writeFileSync(join(receiptsDir, logFile), logBytes);
  const proofFile = `${id}.proof.json`;
  const proofBytes = `${JSON.stringify(
    {
      contract: PROOF_CONTRACT,
      candidate,
      capabilityId: id,
      command: { executable: 'bun', arguments: ['run', 'test:vitest', '--', ...SUITES[id]] },
      exitCode: 0,
      log: { file: logFile, sha256: logSha256 },
      source: { sha256: sourceSha256, paths: MANIFEST_EXCLUSIONS.get(id)! },
    },
    null,
    2
  )}\n`;
  const proofSha256 = sha256(proofBytes);
  writeFileSync(join(receiptsDir, proofFile), proofBytes);
  return { proofFile, proofSha256, logFile, logSha256 };
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'wayland-capability-seal-'));
  const receiptsDir = join(root, 'receipts');
  mkdirSync(receiptsDir);
  roots.push(root);
  const manifestEntries: Array<Record<string, string>> = [];
  const capabilities = [...PACKETS].map(([id, packets]) => {
    const sourceSha256 = sha256(`source:${id}`);
    const proofAuthority = writeProofAuthority(receiptsDir, id, { commit: COMMIT, tree: TREE }, sourceSha256);
    const receipt = {
      contract: RECEIPT_CONTRACT,
      capabilityId: id,
      packets,
      status: 'accepted',
      acceptedCommit: COMMIT,
      acceptedTree: TREE,
      sourceSha256,
      proof: [proofAuthority.proofSha256],
    };
    const receiptFile = `${id}.json`;
    const bytes = `${JSON.stringify(receipt, null, 2)}\n`;
    writeFileSync(join(receiptsDir, receiptFile), bytes);
    manifestEntries.push({ capabilityId: id, receiptFile, receiptSha256: sha256(bytes), ...proofAuthority });
    return {
      id,
      packets,
      mode: 'included',
      excludedPaths: MANIFEST_EXCLUSIONS.get(id)!,
    };
  });
  const selection = { contract: CONTRACT, capabilities };
  const candidate = {
    commit: COMMIT,
    tree: TREE,
    status: '',
    ancestors: [COMMIT],
    acceptedTrees: { [COMMIT]: TREE },
    sourceDigests: {
      [COMMIT]: Object.fromEntries([...PACKETS].map(([id]) => [id, sha256(`source:${id}`)])),
    },
  };
  writeFileSync(
    join(receiptsDir, 'manifest.json'),
    `${JSON.stringify({ contract: RECEIPT_MANIFEST_CONTRACT, candidate: { commit: COMMIT, tree: TREE }, selectionSha256: selectionDigest(selection), receipts: manifestEntries }, null, 2)}\n`
  );
  return {
    root,
    receiptsDir,
    selection,
    candidate,
    verifyAttestedFile: () => undefined,
  };
}

function syncManifest(input: ReturnType<typeof fixture> | ReturnType<typeof realGitFixture>): void {
  const file = join(input.receiptsDir, 'manifest.json');
  const prior = JSON.parse(readFileSync(file, 'utf8')) as {
    contract: string;
    candidate: { commit: string; tree: string };
    receipts: Array<{
      capabilityId: string;
      receiptFile: string;
      receiptSha256: string;
      proofFile: string;
      proofSha256: string;
      logFile: string;
      logSha256: string;
    }>;
  };
  const included = new Set(
    input.selection.capabilities.filter((entry) => entry.mode === 'included').map((entry) => entry.id)
  );
  prior.receipts = prior.receipts
    .filter((entry) => included.has(entry.capabilityId))
    .map((entry) => {
      const proofSha256 = sha256(readFileSync(join(input.receiptsDir, entry.proofFile)));
      const receiptFile = join(input.receiptsDir, entry.receiptFile);
      const receipt = JSON.parse(readFileSync(receiptFile, 'utf8'));
      receipt.proof = [proofSha256];
      writeFileSync(receiptFile, `${JSON.stringify(receipt, null, 2)}\n`);
      return {
        ...entry,
        receiptSha256: sha256(readFileSync(receiptFile)),
        proofSha256,
        logSha256: sha256(readFileSync(join(input.receiptsDir, entry.logFile))),
      };
    });
  prior.candidate =
    'candidate' in input
      ? { commit: input.candidate.commit, tree: input.candidate.tree }
      : { commit: git(input.root, 'rev-parse', 'HEAD'), tree: git(input.root, 'rev-parse', 'HEAD^{tree}') };
  writeFileSync(file, `${JSON.stringify({ ...prior, selectionSha256: selectionDigest(input.selection) }, null, 2)}\n`);
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
  const manifestEntries: Array<Record<string, string>> = [];
  const capabilities = [...PACKETS].map(([id, packets]) => {
    const sourceSha256 = capabilitySourceDigest(root, acceptedCommit, id);
    const proofAuthority = writeProofAuthority(
      receiptsDir,
      id,
      { commit: acceptedCommit, tree: acceptedTree },
      sourceSha256
    );
    const receipt = {
      contract: RECEIPT_CONTRACT,
      capabilityId: id,
      packets,
      status: 'accepted',
      acceptedCommit,
      acceptedTree,
      sourceSha256,
      proof: [proofAuthority.proofSha256],
    };
    const receiptFile = `${id}.json`;
    const bytes = `${JSON.stringify(receipt, null, 2)}\n`;
    writeFileSync(join(receiptsDir, receiptFile), bytes);
    manifestEntries.push({ capabilityId: id, receiptFile, receiptSha256: sha256(bytes), ...proofAuthority });
    return {
      id,
      packets,
      mode: 'included',
      excludedPaths: MANIFEST_EXCLUSIONS.get(id)!,
    };
  });
  const selection = { contract: CONTRACT, capabilities };
  writeFileSync(
    join(receiptsDir, 'manifest.json'),
    `${JSON.stringify({ contract: RECEIPT_MANIFEST_CONTRACT, candidate: { commit: acceptedCommit, tree: acceptedTree }, selectionSha256: selectionDigest(selection), receipts: manifestEntries }, null, 2)}\n`
  );
  return {
    root,
    receiptsDir,
    selection,
    mcpFile,
    verifyAttestedFile: () => undefined,
  };
}

describe('candidate capability seal', () => {
  it('refuses to package without a canonical receipt authority directory', () => {
    const input = fixture();
    delete (input as { receiptsDir?: string }).receiptsDir;

    expect(() => createCapabilitySeal(input)).toThrow(/WAYLAND_CAPABILITY_RECEIPTS_DIR is required/);
  });

  it('seals the exact candidate only when every required receipt is accepted', () => {
    const input = fixture();
    const seal = createCapabilitySeal(input);

    expect(seal).toMatchObject({
      contract: 'wayland-candidate-capability-seal/3.0',
      candidate: { commit: COMMIT, tree: TREE },
    });
    expect((seal.capabilities as unknown[]).length).toBe(5);
    expect(verifyCapabilitySeal(seal)).toBe(seal);
  });

  it('pins every capability authority file to the protected trust-root workflow commit and ref', () => {
    const input = fixture();
    delete (input as { verifyAttestedFile?: unknown }).verifyAttestedFile;
    const commands: string[][] = [];
    const seal = createCapabilitySeal({
      ...input,
      trustRootCommit: TRUST_COMMIT,
      execFileSyncImpl: (_command: string, args: string[]) => {
        commands.push(args);
        const file = args[2];
        const subject = sha256(readFileSync(file)).slice('sha256:'.length);
        return JSON.stringify([
          {
            verificationResult: {
              statement: {
                predicateType: 'https://slsa.dev/provenance/v1',
                subject: [{ digest: { sha256: subject } }],
              },
            },
          },
        ]);
      },
    });

    expect(seal).toMatchObject({ candidate: { commit: COMMIT, tree: TREE } });
    expect(commands).toHaveLength(16);
    for (const args of commands) {
      expect(args[args.indexOf('--signer-workflow') + 1]).toBe(
        'FerroxLabs/wayland/.github/workflows/release-acceptance-trust-root.yml'
      );
      expect(args[args.indexOf('--signer-digest') + 1]).toBe(TRUST_COMMIT);
      expect(args[args.indexOf('--source-digest') + 1]).toBe(TRUST_COMMIT);
      expect(args[args.indexOf('--source-ref') + 1]).toBe('refs/heads/release-trust-v1');
    }
  });

  it('fails closed when the authority manifest has no pinned receipt digest', () => {
    const input = fixture();
    const manifestFile = join(input.receiptsDir, 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
    manifest.receipts[0].receiptSha256 = null;
    writeFileSync(manifestFile, `${JSON.stringify(manifest)}\n`);

    expect(() => createCapabilitySeal(input)).toThrow(/path or digest is invalid/);
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
      acceptedTree: 'e'.repeat(40),
      sourceSha256: sha256('source:mcp'),
      proof: [`sha256:${'c'.repeat(64)}`],
    };
    const bytes = `${JSON.stringify(receipt, null, 2)}\n`;
    writeFileSync(receiptFile, bytes);
    syncManifest(input);
    input.candidate.acceptedTrees[receipt.acceptedCommit] = receipt.acceptedTree;
    input.candidate.sourceDigests[receipt.acceptedCommit] = { mcp: receipt.sourceSha256 };

    expect(() => createCapabilitySeal(input)).toThrow(/does not accept the exact candidate commit and tree/);
  });

  it('rejects a receipt whose accepted tree does not belong to its accepted commit', () => {
    const input = fixture();
    input.candidate.acceptedTrees[COMMIT] = 'f'.repeat(40);

    expect(() => createCapabilitySeal(input)).toThrow(/commit\/tree identity does not exist or match/);
  });

  it('rejects a receipt source digest that does not match its accepted commit', () => {
    const input = fixture();
    const receiptFile = join(input.receiptsDir, 'mcp.json');
    const receipt = JSON.parse(readFileSync(receiptFile, 'utf8')) as Record<string, unknown>;
    receipt.sourceSha256 = sha256('forged accepted source');
    const bytes = `${JSON.stringify(receipt, null, 2)}\n`;
    writeFileSync(receiptFile, bytes);
    syncManifest(input);

    expect(() => createCapabilitySeal(input)).toThrow(/does not bind its accepted capability source/);
  });

  it('rejects a legacy receipt missing the source digest critical field', () => {
    const input = fixture();
    const receiptFile = join(input.receiptsDir, 'mcp.json');
    const receipt = JSON.parse(readFileSync(receiptFile, 'utf8')) as Record<string, unknown>;
    delete receipt.sourceSha256;
    const bytes = `${JSON.stringify(receipt, null, 2)}\n`;
    writeFileSync(receiptFile, bytes);
    syncManifest(input);

    expect(() => createCapabilitySeal(input)).toThrow(/invalid contract or critical fields/);
  });

  it('rejects receipt bytes that disagree with the pinned digest', () => {
    const input = fixture();
    writeFileSync(join(input.receiptsDir, 'voice.json'), '{}\n');

    expect(() => createCapabilitySeal(input)).toThrow(/digest mismatch: voice/);
  });

  it('rejects arbitrary proof bytes even when their digest is pinned', () => {
    const input = fixture();
    writeFileSync(join(input.receiptsDir, 'mcp.proof.json'), 'arbitrary green bytes\n');
    syncManifest(input);

    expect(() => createCapabilitySeal(input)).toThrow(/proof is not structured JSON/i);
  });

  it.each([
    [
      'command',
      (proof: any) => (proof.command.arguments = ['run', 'test:vitest', '--', 'tests/fake-green.test.ts']),
      /canonical capability suite/,
    ],
    ['exit code', (proof: any) => (proof.exitCode = 1), /successful canonical suite/],
    ['candidate', (proof: any) => (proof.candidate.commit = 'f'.repeat(40)), /stale or foreign candidate/],
    ['capability', (proof: any) => (proof.capabilityId = 'voice'), /mismatched capability identity/],
    ['source', (proof: any) => (proof.source.sha256 = sha256('stale source')), /canonical capability source inventory/],
    ['unknown field', (proof: any) => (proof.authorizesRelease = true), /invalid contract or critical fields/],
  ])('rejects a semantically forged proof %s even when the forged bytes are pinned', (_name, mutate, message) => {
    const input = fixture();
    const file = join(input.receiptsDir, 'mcp.proof.json');
    const proof = JSON.parse(readFileSync(file, 'utf8'));
    mutate(proof);
    writeFileSync(file, `${JSON.stringify(proof, null, 2)}\n`);
    syncManifest(input);

    expect(() => createCapabilitySeal(input)).toThrow(message);
  });

  it('rejects missing structured proof evidence', () => {
    const input = fixture();
    rmSync(join(input.receiptsDir, 'mcp.proof.json'));

    expect(() => createCapabilitySeal(input)).toThrow();
  });

  it('rejects an ancestor receipt even across an unrelated successor commit', () => {
    const input = realGitFixture();
    const unrelated = join(input.root, 'docs/unrelated.md');
    mkdirSync(dirname(unrelated), { recursive: true });
    writeFileSync(unrelated, 'unrelated successor\n');
    commit(input.root, 'unrelated successor');
    syncManifest(input);

    expect(() => createCapabilitySeal(input)).toThrow(/does not accept the exact candidate commit and tree/);
  });

  it('rejects an ancestor receipt after a capability-owned source changes', () => {
    const input = realGitFixture();
    writeFileSync(input.mcpFile, 'export const version = 2;\n');
    commit(input.root, 'regress accepted mcp source');
    syncManifest(input);

    expect(() => createCapabilitySeal(input)).toThrow(/does not accept the exact candidate commit and tree/);
  });

  it('rejects a selection that omits any authoritative exclusion path', () => {
    const input = fixture();
    const voice = input.selection.capabilities.find((entry) => entry.id === 'voice')!;
    voice.mode = 'excluded';
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
      syncManifest(input);
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

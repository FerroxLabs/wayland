import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const { SUITES, generateCapabilityAcceptanceReceipts } =
  require('../../../scripts/capability-seal/generateCapabilityAcceptanceReceipts') as {
    SUITES: Record<string, string[]>;
    generateCapabilityAcceptanceReceipts: (options: Record<string, unknown>) => {
      contract: string;
      candidate: { commit: string; tree: string };
      receipts: Array<Record<string, string>>;
    };
  };

const selection = JSON.parse(
  readFileSync(join(process.cwd(), 'scripts/capability-seal/candidate-capabilities.json'), 'utf8')
) as { capabilities: Array<{ id: string }> };
const roots: string[] = [];

function git(root: string, ...args: string[]): string {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
}

function repository(): { root: string; commit: string; tree: string } {
  const root = mkdtempSync(join(tmpdir(), 'wayland-capability-generator-'));
  roots.push(root);
  git(root, 'init', '--quiet');
  git(root, 'config', 'user.email', 'capability-generator@example.test');
  git(root, 'config', 'user.name', 'Capability Generator Test');
  writeFileSync(join(root, 'README.md'), 'fixture\n');
  git(root, 'add', 'README.md');
  git(root, 'commit', '-m', 'fixture');
  return { root, commit: git(root, 'rev-parse', 'HEAD'), tree: git(root, 'rev-parse', 'HEAD^{tree}') };
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('capability acceptance receipt generator', () => {
  it('generates one exact receipt and proof for every included capability', () => {
    const candidate = repository();
    const outDir = join(candidate.root, '..', `${candidate.commit}-receipts`);
    roots.push(outDir);
    const calls: Array<{ id: string; files: string[] }> = [];

    const manifest = generateCapabilityAcceptanceReceipts({
      root: candidate.root,
      outDir,
      selection,
      candidate: { commit: candidate.commit, tree: candidate.tree },
      runSuite: (_root: string, files: string[], id: string) => {
        calls.push({ id, files });
        return { status: 0, stdout: `${id}: green\n`, stderr: '' };
      },
    });

    expect(manifest).toMatchObject({
      contract: 'wayland-capability-acceptance-manifest/2.0',
      candidate: { commit: candidate.commit, tree: candidate.tree },
    });
    expect(manifest.receipts).toHaveLength(selection.capabilities.length);
    expect(calls.map(({ id }) => id)).toEqual(selection.capabilities.map(({ id }) => id));
    for (const call of calls) expect(call.files).toEqual(SUITES[call.id]);

    for (const entry of manifest.receipts) {
      const receipt = JSON.parse(readFileSync(join(outDir, entry.receiptFile), 'utf8')) as {
        capabilityId: string;
        acceptedCommit: string;
        acceptedTree: string;
        proof: string[];
      };
      const proof = JSON.parse(readFileSync(join(outDir, entry.proofFile), 'utf8')) as {
        contract: string;
        candidate: { commit: string; tree: string };
        capabilityId: string;
        command: { executable: string; arguments: string[] };
        exitCode: number;
        log: { file: string; sha256: string };
        source: { sha256: string; paths: string[] };
      };
      expect(receipt).toMatchObject({
        capabilityId: entry.capabilityId,
        acceptedCommit: candidate.commit,
        acceptedTree: candidate.tree,
      });
      expect(receipt.proof).toEqual([entry.proofSha256]);
      expect(proof).toMatchObject({
        contract: 'wayland-capability-proof/1.0',
        candidate: { commit: candidate.commit, tree: candidate.tree },
        capabilityId: entry.capabilityId,
        command: { executable: 'bun', arguments: ['run', 'test:vitest', '--', ...SUITES[entry.capabilityId]] },
        exitCode: 0,
        log: { file: entry.logFile, sha256: entry.logSha256 },
      });
      expect(proof.source.paths.length).toBeGreaterThan(0);
      expect(readFileSync(join(outDir, entry.logFile), 'utf8')).toContain(`${entry.capabilityId}: green`);
    }
  });

  it('fails closed and does not mint a manifest when any canonical suite is red', () => {
    const candidate = repository();
    const outDir = join(candidate.root, '..', `${candidate.commit}-red-receipts`);
    roots.push(outDir);

    expect(() =>
      generateCapabilityAcceptanceReceipts({
        root: candidate.root,
        outDir,
        selection,
        candidate: { commit: candidate.commit, tree: candidate.tree },
        runSuite: (_root: string, _files: string[], id: string) => ({
          status: id === 'mcp' ? 1 : 0,
          stdout: '',
          stderr: id === 'mcp' ? 'hostile failure' : '',
        }),
      })
    ).toThrow(/Canonical capability acceptance suite failed: mcp/);
    expect(() => readFileSync(join(outDir, 'manifest.json'))).toThrow();
  });

  it('refuses to overwrite an existing evidence directory', () => {
    const candidate = repository();
    expect(() =>
      generateCapabilityAcceptanceReceipts({
        root: candidate.root,
        outDir: candidate.root,
        selection,
        candidate: { commit: candidate.commit, tree: candidate.tree },
        runSuite: () => ({ status: 0, stdout: '', stderr: '' }),
      })
    ).toThrow(/output directory already exists/);
  });
});

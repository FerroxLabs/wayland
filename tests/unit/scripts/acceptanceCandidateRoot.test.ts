import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const { DEFAULT_VERIFIERS } = require('../../../scripts/release-acceptance/verifyFinalAcceptance') as {
  DEFAULT_VERIFIERS: { observeCandidateIdentity: () => { commit: string; tree: string } };
};

const roots: string[] = [];
const original = process.env.WAYLAND_ACCEPTANCE_CANDIDATE_ROOT;

function git(root: string, ...args: string[]): string {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
}

function repository(): string {
  const allocated = mkdtempSync(join(tmpdir(), 'wayland-acceptance-candidate-'));
  roots.push(allocated);
  git(allocated, 'init', '--quiet');
  // The candidate root has to be spelled the way Git spells it, because the
  // verifier compares the configured root against `rev-parse --show-toplevel`.
  // os.tmpdir() reads %TEMP%, which on a Windows runner is an 8.3 short path
  // ('C:\Users\RUNNER~1\AppData\Local\Temp'), and realpathSync does not expand
  // short names - so seeding the root from os.tmpdir() compared two different
  // spellings of the same directory and always failed with
  // candidate-root-is-not-worktree-top-level there. Asking Git makes both
  // sides come from one source. On POSIX this is realpathSync(allocated): Git
  // resolves /var -> /private/var identically.
  const root = resolve(git(allocated, 'rev-parse', '--show-toplevel'));
  git(root, 'config', 'user.email', 'acceptance-root@example.test');
  git(root, 'config', 'user.name', 'Acceptance Root Test');
  writeFileSync(join(root, 'candidate.txt'), 'exact candidate\n');
  git(root, 'add', 'candidate.txt');
  git(root, 'commit', '-m', 'candidate');
  return root;
}

afterEach(() => {
  if (original === undefined) delete process.env.WAYLAND_ACCEPTANCE_CANDIDATE_ROOT;
  else process.env.WAYLAND_ACCEPTANCE_CANDIDATE_ROOT = original;
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('protected acceptance candidate root', () => {
  it('observes one clean exact Git worktree', () => {
    const root = repository();
    process.env.WAYLAND_ACCEPTANCE_CANDIDATE_ROOT = root;

    expect(DEFAULT_VERIFIERS.observeCandidateIdentity()).toEqual({
      commit: git(root, 'rev-parse', 'HEAD'),
      tree: git(root, 'rev-parse', 'HEAD^{tree}'),
    });
  });

  it('fails closed when the candidate root is absent or dirty', () => {
    delete process.env.WAYLAND_ACCEPTANCE_CANDIDATE_ROOT;
    expect(() => DEFAULT_VERIFIERS.observeCandidateIdentity()).toThrow(/WAYLAND_ACCEPTANCE_CANDIDATE_ROOT-required/);

    const root = repository();
    writeFileSync(join(root, 'untracked.txt'), 'mutable\n');
    process.env.WAYLAND_ACCEPTANCE_CANDIDATE_ROOT = root;
    expect(() => DEFAULT_VERIFIERS.observeCandidateIdentity()).toThrow(/dirty-source-tree/);
  });

  it('rejects a symlink alias instead of silently changing candidate identity', () => {
    const root = repository();
    const link = `${root}-link`;
    roots.push(link);
    symlinkSync(root, link);
    process.env.WAYLAND_ACCEPTANCE_CANDIDATE_ROOT = link;

    expect(() => DEFAULT_VERIFIERS.observeCandidateIdentity()).toThrow(/candidate-root-must-be-real-directory/);
  });
});

/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { buildAuthArgs, buildCloneArgs, deriveRepoName, isValidGitUrl, scrubSecrets } from '@process/services/gitClone';

describe('gitClone — URL validation', () => {
  it('accepts https / http / ssh / git and scp-like remotes', () => {
    expect(isValidGitUrl('https://github.com/owner/repo.git')).toBe(true);
    expect(isValidGitUrl('http://host/owner/repo')).toBe(true);
    expect(isValidGitUrl('ssh://git@host/owner/repo.git')).toBe(true);
    expect(isValidGitUrl('git://host/owner/repo.git')).toBe(true);
    expect(isValidGitUrl('git@github.com:owner/repo.git')).toBe(true);
  });

  it('rejects empty, option-injection, and local/file paths', () => {
    expect(isValidGitUrl('')).toBe(false);
    expect(isValidGitUrl('   ')).toBe(false);
    expect(isValidGitUrl('--upload-pack=evil')).toBe(false);
    expect(isValidGitUrl('file:///etc/passwd')).toBe(false);
    expect(isValidGitUrl('/tmp/local/repo')).toBe(false);
  });
});

describe('gitClone — repo-name derivation', () => {
  it('strips .git and keeps a filesystem-safe name', () => {
    expect(deriveRepoName('https://github.com/owner/My.Repo.git')).toBe('My.Repo');
    expect(deriveRepoName('git@github.com:owner/repo.git')).toBe('repo');
    expect(deriveRepoName('https://x.com/a/b/')).toBe('b');
    expect(deriveRepoName('git@host:soloRepo.git')).toBe('soloRepo');
  });

  it('falls back to "repo" only when nothing usable remains', () => {
    expect(deriveRepoName('')).toBe('repo');
    expect(deriveRepoName('   ')).toBe('repo');
    // A path-less URL has no repo segment; deriving the host is an acceptable,
    // filesystem-safe non-empty name (not the "repo" fallback).
    expect(deriveRepoName('https://host/')).toBe('host');
  });
});

describe('gitClone — auth arg construction', () => {
  it('none/undefined adds no flags but sets a non-interactive env', () => {
    const { args, env } = buildAuthArgs(undefined);
    expect(args).toEqual([]);
    expect(env.GIT_TERMINAL_PROMPT).toBe('0');
    expect(buildAuthArgs({ kind: 'none' }).args).toEqual([]);
  });

  it('token defaults the username and injects a command-scoped Basic header', () => {
    const { args } = buildAuthArgs({ kind: 'token', token: 'secret-tok' });
    const expected = Buffer.from('x-access-token:secret-tok').toString('base64');
    expect(args).toContain('credential.helper=');
    expect(args).toContain(`http.extraHeader=Authorization: Basic ${expected}`);
  });

  it('token honors a custom username', () => {
    const { args } = buildAuthArgs({ kind: 'token', username: 'alice', token: 'tok' });
    const expected = Buffer.from('alice:tok').toString('base64');
    expect(args).toContain(`http.extraHeader=Authorization: Basic ${expected}`);
  });

  it('ssh with a key path sets GIT_SSH_COMMAND and no args', () => {
    const { args, env } = buildAuthArgs({ kind: 'ssh', privateKeyPath: '/home/u/.ssh/id_ed25519' });
    expect(args).toEqual([]);
    expect(env.GIT_SSH_COMMAND).toContain('-i "/home/u/.ssh/id_ed25519"');
    expect(env.GIT_SSH_COMMAND).toContain('IdentitiesOnly=yes');
  });

  it('ssh without a key path leaves GIT_SSH_COMMAND unset (use the agent)', () => {
    const { env } = buildAuthArgs({ kind: 'ssh' });
    expect(env.GIT_SSH_COMMAND).toBeUndefined();
  });
});

describe('gitClone — clone argv safety', () => {
  it('passes the URL after `--` so a hostile URL cannot smuggle options', () => {
    const { args } = buildCloneArgs({ url: '--upload-pack=evil', destDir: '/w/dest' });
    const dd = args.indexOf('--');
    expect(dd).toBeGreaterThanOrEqual(0);
    expect(args.indexOf('--upload-pack=evil')).toBe(dd + 1);
    expect(args[dd + 2]).toBe('/w/dest');
  });

  it('includes a depth flag only when requested', () => {
    expect(buildCloneArgs({ url: 'https://h/r.git', destDir: '/d' }).args).not.toContain('--depth');
    expect(buildCloneArgs({ url: 'https://h/r.git', destDir: '/d', depth: 1 }).args).toContain('--depth');
  });
});

describe('gitClone — secret scrubbing', () => {
  it('redacts Basic auth headers and inline userinfo', () => {
    expect(scrubSecrets('fatal: Authorization: Basic YWxpY2U6dG9r denied')).toBe(
      'fatal: Authorization: Basic *** denied'
    );
    expect(scrubSecrets('remote https://alice:ghp_xxx@github.com/o/r.git failed')).toBe(
      'remote https://***:***@github.com/o/r.git failed'
    );
  });
});

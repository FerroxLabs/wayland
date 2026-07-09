/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Low-level git clone/pull runner. Mirrors how Tank ingests a repo by URL
 * (see tankClient.ts / AutopilotService.ts), but runs the clone ON THIS MACHINE
 * so the result becomes a real local project workspace.
 *
 * Security posture:
 *   - HTTPS tokens are injected as a COMMAND-SCOPED Basic auth header
 *     (`-c http.extraHeader=...`). Command-scoped `-c` is never written into the
 *     cloned repo's `.git/config`, so the token does not persist on disk in the
 *     repo. (It does appear in this process's argv for the git child; that is a
 *     same-user local exposure only, acceptable for a desktop app.)
 *   - The token is NEVER embedded in the remote URL (which WOULD persist it in
 *     `.git/config` and every future `git remote -v`).
 *   - A malicious URL cannot smuggle git options: the URL is passed after `--`.
 *   - `GIT_TERMINAL_PROMPT=0` makes auth failures fail fast instead of hanging
 *     on an invisible credential prompt.
 *   - {@link scrubSecrets} redacts any Basic header / userinfo before an error
 *     message leaves this module.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { IGitCloneAuth } from '@/common/types/project';

const execFileAsync = promisify(execFile);

/** 32 MiB - a large clone's progress output can be chatty. */
const MAX_BUFFER = 32 * 1024 * 1024;

export type CloneParams = {
  url: string;
  /** Destination directory - must exist and be empty (git refuses a non-empty dir). */
  destDir: string;
  auth?: IGitCloneAuth;
  /** Shallow-clone depth; omit for a full clone. */
  depth?: number;
};

const SCP_LIKE = /^[^@\s]+@[^:\s]+:.+/; // git@github.com:owner/repo.git

/**
 * Accept only remote transports (https/http/ssh/git + scp-like). Rejects empty
 * input, a leading `-` (option injection), and `file:`/local paths so a renderer
 * can't drive a clone of an arbitrary local directory.
 */
export function isValidGitUrl(url: string): boolean {
  const s = (url || '').trim();
  if (!s || s.startsWith('-')) return false;
  if (/^(https?|ssh|git):\/\/[^\s]+$/i.test(s)) return true;
  if (SCP_LIKE.test(s)) return true;
  return false;
}

/** Derive a filesystem-safe repo name from a clone URL (strips `.git`). */
export function deriveRepoName(url: string): string {
  let s = (url || '').trim().replace(/\/+$/, '');
  // Last path segment; for scp-like `git@host:repo` with no slash, take after ':'.
  let name = s.split('/').pop() || '';
  if (name.includes(':')) name = name.split(':').pop() || name;
  name = name
    .replace(/\.git$/i, '')
    .replace(/[^A-Za-z0-9._-]/g, '-')
    .replace(/^-+|-+$/g, '');
  return name || 'repo';
}

/**
 * Build the auth-specific git `-c` flags + environment for a clone/pull.
 * Env is a DELTA over `process.env` - callers must spread it, never replace.
 * Exported for unit testing.
 */
export function buildAuthArgs(auth?: IGitCloneAuth): { args: string[]; env: NodeJS.ProcessEnv } {
  const env: NodeJS.ProcessEnv = { GIT_TERMINAL_PROMPT: '0' };
  const args: string[] = [];
  if (!auth || auth.kind === 'none') return { args, env };

  if (auth.kind === 'token') {
    const username = auth.username?.trim() || 'x-access-token';
    const basic = Buffer.from(`${username}:${auth.token}`).toString('base64');
    // `credential.helper=` (empty) disables any configured helper so nothing
    // caches/persists the credential; extraHeader carries the Basic auth.
    args.push('-c', 'credential.helper=', '-c', `http.extraHeader=Authorization: Basic ${basic}`);
  } else if (auth.kind === 'ssh') {
    const keyPath = auth.privateKeyPath?.trim();
    if (keyPath) {
      // IdentitiesOnly stops ssh from offering other agent keys first.
      env.GIT_SSH_COMMAND = `ssh -i "${keyPath}" -o IdentitiesOnly=yes`;
    }
  }
  return { args, env };
}

/** Assemble the full `git clone` argv (auth flags + `--` guard). Exported for tests. */
export function buildCloneArgs(params: CloneParams): { args: string[]; env: NodeJS.ProcessEnv } {
  const { args: authArgs, env } = buildAuthArgs(params.auth);
  const args = [...authArgs, 'clone'];
  if (params.depth && params.depth > 0) args.push('--depth', String(params.depth));
  args.push('--', params.url, params.destDir);
  return { args, env };
}

/** Redact any Basic auth header or `//user:pass@` userinfo from a string. */
export function scrubSecrets(text: string): string {
  return (text || '')
    .replace(/Authorization: Basic [A-Za-z0-9+/=]+/gi, 'Authorization: Basic ***')
    .replace(/\/\/[^@\s/]+:[^@\s/]+@/g, '//***:***@');
}

function errText(e: unknown): string {
  const err = e as { stderr?: string; message?: string };
  return scrubSecrets(err?.stderr?.trim() || err?.message || String(e));
}

/** Clone `params.url` into `params.destDir`. Throws a scrubbed Error on failure. */
export async function cloneRepo(params: CloneParams): Promise<void> {
  if (!isValidGitUrl(params.url)) {
    throw new Error('Invalid or unsupported git URL.');
  }
  const { args, env } = buildCloneArgs(params);
  try {
    await execFileAsync('git', args, { env: { ...process.env, ...env }, maxBuffer: MAX_BUFFER });
  } catch (e) {
    // Attach a SCRUBBED cause (never the raw `e`) so credentials in the
    // original message/stderr/argv can't leak through the error chain. This is
    // why we intentionally do not `cause: e` as preserve-caught-error wants.
    const detail = errText(e);
    // eslint-disable-next-line preserve-caught-error -- raw cause may carry secrets
    throw new Error(`git clone failed: ${detail}`, { cause: new Error(detail) });
  }
}

/** `git pull --ff-only` an existing workspace, re-applying stored auth. Returns combined output. */
export async function pullRepo(workspace: string, auth?: IGitCloneAuth): Promise<string> {
  const { args: authArgs, env } = buildAuthArgs(auth);
  const args = ['-C', workspace, ...authArgs, 'pull', '--ff-only'];
  try {
    const { stdout, stderr } = await execFileAsync('git', args, {
      env: { ...process.env, ...env },
      maxBuffer: MAX_BUFFER,
    });
    return `${stdout}${stderr}`.trim();
  } catch (e) {
    // Scrubbed cause only - see cloneRepo.
    const detail = errText(e);
    // eslint-disable-next-line preserve-caught-error -- raw cause may carry secrets
    throw new Error(`git pull failed: ${detail}`, { cause: new Error(detail) });
  }
}

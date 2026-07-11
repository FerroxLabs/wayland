/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * One-click developer chores for a fork maintainer, driven by local `git` and
 * the authenticated GitHub CLI (`gh`).
 *
 * Security posture (mirrors gitClone.ts):
 *   - Non-interactive git/gh env so a missing credential fails fast instead of
 *     hanging on an invisible prompt.
 *   - All arguments are passed as an argv array to `execFile` (never a shell
 *     string), so a commit message / branch / repo slug cannot inject a command.
 *   - Repo slugs and platform names are allowlist-validated before they reach
 *     `gh`; branch names are sanitized to `[A-Za-z0-9._/-]`.
 *   - {@link scrubSecrets} redacts any token/Basic header before an error or a
 *     streamed log line leaves this module.
 *   - `cwd` for the local commit flow is validated to be a real git work tree
 *     first (`rev-parse --is-inside-work-tree`), so a bogus path fails cleanly.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { scrubSecrets } from './gitClone';

const execFileAsync = promisify(execFile);

/** git/gh operations here are quick (commit/push/dispatch), not big clones. */
const OPERATION_TIMEOUT_MS = 3 * 60 * 1000;
const MAX_BUFFER = 8 * 1024 * 1024;

const NON_INTERACTIVE_ENV: NodeJS.ProcessEnv = {
  GIT_TERMINAL_PROMPT: '0',
  GCM_INTERACTIVE: 'never',
  // gh honors these to stay non-interactive / uncolored for clean log capture.
  GH_PROMPT_DISABLED: '1',
  NO_COLOR: '1',
};

/** `owner/repo` - the only shape accepted for a `gh -R` target. */
const REPO_SLUG = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;

/** Platforms build-manual.yml accepts (kept in sync with its `platform` input). */
const RELEASE_PLATFORMS = new Set([
  'macos-arm64',
  'macos-x64',
  'windows-x64',
  'windows-arm64',
  'linux-x64',
  'linux-arm64',
  'all',
]);

export type LogFn = (line: string) => void;

/** Errors that carry a scrubbed, user-facing message (never a raw one). */
export class DevActionError extends Error {}

function toDevActionError(e: unknown, fallback: string): DevActionError {
  const err = e as { code?: string; stderr?: string; message?: string; killed?: boolean };
  if (err?.code === 'ENOENT') {
    // execFile could not spawn the binary at all.
    return new DevActionError(`${fallback}: required CLI not found on PATH (is git / gh installed?)`);
  }
  if (err?.killed === true) {
    return new DevActionError(`${fallback}: command timed out`);
  }
  const detail = scrubSecrets(err?.stderr?.trim() || err?.message || String(e));
  return new DevActionError(`${fallback}: ${detail || 'unknown error'}`);
}

/**
 * Run one CLI step, streaming its label + scrubbed output through `onLog`.
 * Throws a {@link DevActionError} (scrubbed) on non-zero exit. `allowFail`
 * returns the caught error instead of throwing (for probe steps).
 */
async function step(
  onLog: LogFn,
  label: string,
  file: string,
  args: string[],
  opts: { cwd?: string; allowFail?: boolean } = {}
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  onLog(`$ ${label}`);
  try {
    const { stdout, stderr } = await execFileAsync(file, args, {
      cwd: opts.cwd,
      env: { ...process.env, ...NON_INTERACTIVE_ENV },
      maxBuffer: MAX_BUFFER,
      timeout: OPERATION_TIMEOUT_MS,
      windowsHide: true,
    });
    const out = scrubSecrets(`${stdout}${stderr}`).trim();
    if (out) onLog(out);
    return { ok: true, stdout, stderr };
  } catch (e) {
    if (opts.allowFail) {
      const err = e as { stdout?: string; stderr?: string };
      return { ok: false, stdout: err?.stdout || '', stderr: err?.stderr || '' };
    }
    const scrubbed = toDevActionError(e, label);
    onLog(scrubbed.message);
    throw scrubbed;
  }
}

/** Derive a git-safe branch slug from a commit message. Exported for tests. */
export function branchSlug(message: string): string {
  const slug = message
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug || 'update';
}

/** Constrain a branch/ref to git-safe characters. Exported for tests. */
export function sanitizeBranch(input: string): string {
  return input.trim().replace(/[^A-Za-z0-9._/-]/g, '-');
}

const DEFAULT_BRANCHES = new Set(['main', 'master', 'HEAD']);

/**
 * Stage tracked changes, commit, push a branch, and open a PR on `cwd`.
 * Returns the PR url (or the existing one if a PR for the branch already exists).
 */
export async function commitAndPr(
  params: { cwd: string; message: string; base?: string },
  onLog: LogFn
): Promise<{ ok: boolean; prUrl?: string; branch?: string; error?: string }> {
  const cwd = params.cwd?.trim();
  const message = params.message?.trim();
  if (!cwd) return { ok: false, error: 'No repository folder selected.' };
  if (!message) return { ok: false, error: 'A commit message is required.' };
  const base = sanitizeBranch(params.base?.trim() || 'main') || 'main';

  try {
    // 1. Must be a real git work tree.
    const inside = await step(onLog, 'git rev-parse --is-inside-work-tree', 'git', [
      '-C',
      cwd,
      'rev-parse',
      '--is-inside-work-tree',
    ]).catch((): null => null);
    if (!inside || inside.stdout.trim() !== 'true') {
      return { ok: false, error: 'That folder is not a git repository.' };
    }

    // 2. Current branch; cut a feature branch if we're on the default one.
    const head = await step(onLog, 'git rev-parse --abbrev-ref HEAD', 'git', [
      '-C',
      cwd,
      'rev-parse',
      '--abbrev-ref',
      'HEAD',
    ]);
    let branch = sanitizeBranch(head.stdout.trim());
    if (DEFAULT_BRANCHES.has(branch)) {
      branch = `chore/${branchSlug(message)}`;
      await step(onLog, `git checkout -b ${branch}`, 'git', ['-C', cwd, 'checkout', '-b', branch]);
    }

    // 3. Stage TRACKED changes only (never sweep untracked junk), then confirm
    //    there is actually something staged before committing.
    await step(onLog, 'git add -u', 'git', ['-C', cwd, 'add', '-u']);
    const staged = await step(onLog, 'git diff --cached --quiet', 'git', ['-C', cwd, 'diff', '--cached', '--quiet'], {
      allowFail: true,
    });
    if (staged.ok) {
      // exit 0 => no staged diff.
      return { ok: false, branch, error: 'No tracked changes to commit.' };
    }

    // 4. Commit + push.
    await step(onLog, `git commit -m "${message}"`, 'git', ['-C', cwd, 'commit', '-m', message]);
    await step(onLog, `git push -u origin ${branch}`, 'git', ['-C', cwd, 'push', '-u', 'origin', branch]);

    // 5. Open the PR (gh infers repo from the checkout's origin remote).
    const created = await step(
      onLog,
      'gh pr create',
      'gh',
      ['pr', 'create', '--head', branch, '--base', base, '--title', message, '--body', message, '--fill'],
      { cwd, allowFail: true }
    );
    let prUrl = firstUrl(created.stdout);
    if (!prUrl) {
      // Already-exists (or --fill quirk): read the branch's existing PR url.
      const view = await step(
        onLog,
        'gh pr view --json url',
        'gh',
        ['pr', 'view', branch, '--json', 'url', '-q', '.url'],
        {
          cwd,
          allowFail: true,
        }
      );
      prUrl = firstUrl(view.stdout);
      if (!prUrl) {
        const detail = scrubSecrets(created.stderr).trim();
        return { ok: false, branch, error: detail || 'Pushed the branch, but could not open a PR.' };
      }
    }
    onLog(`PR ready: ${prUrl}`);
    return { ok: true, prUrl, branch };
  } catch (e) {
    return { ok: false, error: e instanceof DevActionError ? e.message : scrubSecrets(String(e)) };
  }
}

/** First https URL found in text (the PR/run link gh prints). */
function firstUrl(text: string): string | undefined {
  const m = (text || '').match(/https:\/\/\S+/);
  return m ? m[0].trim() : undefined;
}

/** Dispatch the Manual Build workflow (build-manual.yml) for `repo`. */
export async function buildRelease(
  params: { repo: string; branch: string; platform: string },
  onLog: LogFn
): Promise<{ ok: boolean; runUrl?: string; error?: string }> {
  const repo = params.repo?.trim();
  const branch = sanitizeBranch(params.branch?.trim() || 'main') || 'main';
  const platform = params.platform?.trim();
  if (!repo || !REPO_SLUG.test(repo)) return { ok: false, error: 'Invalid repository (expected owner/repo).' };
  if (!platform || !RELEASE_PLATFORMS.has(platform)) return { ok: false, error: 'Unsupported build platform.' };

  try {
    await step(onLog, `gh workflow run build-manual.yml -R ${repo} (${platform} on ${branch})`, 'gh', [
      'workflow',
      'run',
      'build-manual.yml',
      '-R',
      repo,
      '-f',
      `branch=${branch}`,
      '-f',
      `platform=${platform}`,
    ]);
    const runUrl = `https://github.com/${repo}/actions/workflows/build-manual.yml`;
    onLog(`Build dispatched. Watch it here: ${runUrl}`);
    return { ok: true, runUrl };
  } catch (e) {
    return { ok: false, error: e instanceof DevActionError ? e.message : scrubSecrets(String(e)) };
  }
}

/** Dispatch upstream-sync.yml on each fork repo; collect a per-repo result. */
export async function syncForks(
  params: { repos: string[] },
  onLog: LogFn
): Promise<{ results: Array<{ repo: string; ok: boolean; error?: string }> }> {
  const repos = (params.repos || []).map((r) => r.trim()).filter(Boolean);
  const results: Array<{ repo: string; ok: boolean; error?: string }> = [];
  for (const repo of repos) {
    if (!REPO_SLUG.test(repo)) {
      results.push({ repo, ok: false, error: 'Invalid repository slug.' });
      continue;
    }
    try {
      await step(onLog, `gh workflow run upstream-sync.yml -R ${repo}`, 'gh', [
        'workflow',
        'run',
        'upstream-sync.yml',
        '-R',
        repo,
      ]);
      onLog(`Sync dispatched for ${repo}.`);
      results.push({ repo, ok: true });
    } catch (e) {
      results.push({ repo, ok: false, error: e instanceof DevActionError ? e.message : scrubSecrets(String(e)) });
    }
  }
  return { results };
}

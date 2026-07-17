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
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { scrubSecrets } from './gitClone';

const execFileAsync = promisify(execFile);

/** git/gh operations here are quick (commit/push/dispatch), not big clones. */
const OPERATION_TIMEOUT_MS = 3 * 60 * 1000;
/** A local build (electron-vite / installer) can run for many minutes. */
const BUILD_TIMEOUT_MS = 30 * 60 * 1000;
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

/** Only this disposable branch may be force-updated during an upstream sync. */
const SYNC_BRANCH = 'automated/upstream-sync';

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

export type ForkSyncStatus = 'up-to-date' | 'created' | 'updated';

export type ForkSyncResult = {
  repo: string;
  ok: boolean;
  status?: ForkSyncStatus;
  prUrl?: string;
  upstream?: string;
  upstreamCommits?: number;
  preservedForkCommits?: number;
  error?: string;
};

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
  opts: { cwd?: string; allowFail?: boolean; timeoutMs?: number } = {}
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  onLog(`$ ${label}`);
  try {
    const { stdout, stderr } = await execFileAsync(file, args, {
      cwd: opts.cwd,
      env: { ...process.env, ...NON_INTERACTIVE_ENV },
      maxBuffer: MAX_BUFFER,
      timeout: opts.timeoutMs ?? OPERATION_TIMEOUT_MS,
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

/**
 * Run a read-only git query without streaming to the shared log (status polls
 * would otherwise spam it). Never throws: a failure returns `{ ok: false }`.
 */
async function gitQuiet(args: string[]): Promise<{ ok: boolean; stdout: string }> {
  try {
    const { stdout } = await execFileAsync('git', args, {
      env: { ...process.env, ...NON_INTERACTIVE_ENV },
      maxBuffer: MAX_BUFFER,
      timeout: OPERATION_TIMEOUT_MS,
      windowsHide: true,
    });
    return { ok: true, stdout };
  } catch (e) {
    const err = e as { stdout?: string };
    return { ok: false, stdout: err?.stdout || '' };
  }
}

export type RepoStatus = {
  path: string;
  name: string;
  branch?: string;
  /** Tracked changes (what a Commit + Push would stage via `add -u`). */
  changed: number;
  /** Untracked files — shown as info only; never committed by this panel. */
  untracked: number;
  error?: string;
};

/**
 * Read-only working-copy status for local checkouts: branch + change counts.
 * `changed` counts only TRACKED changes (matches what {@link commitAndPr} stages
 * with `add -u`); `untracked` is reported separately and never committed here.
 */
export async function repoStatus(params: { paths: string[] }): Promise<{ results: RepoStatus[] }> {
  const paths = (params.paths || []).map((p) => p.trim()).filter(Boolean);
  const results: RepoStatus[] = [];
  for (const path of paths) {
    const name =
      path
        .replace(/[\\/]+$/, '')
        .split(/[\\/]/)
        .pop() || path;
    const inside = await gitQuiet(['-C', path, 'rev-parse', '--is-inside-work-tree']);
    if (!inside.ok || inside.stdout.trim() !== 'true') {
      results.push({ path, name, changed: 0, untracked: 0, error: 'Not a git repository.' });
      continue;
    }
    const head = await gitQuiet(['-C', path, 'rev-parse', '--abbrev-ref', 'HEAD']);
    const status = await gitQuiet(['-C', path, 'status', '--porcelain']);
    let changed = 0;
    let untracked = 0;
    for (const line of status.stdout.split('\n')) {
      if (!line.trim()) continue;
      if (line.startsWith('??')) untracked++;
      else changed++;
    }
    results.push({ path, name, branch: head.ok ? head.stdout.trim() : undefined, changed, untracked });
  }
  return { results };
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

/** npm-script name shape accepted for a local build (no flags, no shell chars). */
const BUILD_SCRIPT = /^[A-Za-z0-9:._-]+$/;

async function fileExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Pick the package manager from the checkout's lockfile. `bun` ships `bun.exe`;
 * `npm` / `pnpm` / `yarn` are `.cmd` shims on Windows, so execFile needs the
 * `.cmd` suffix there (args stay an argv array, so no shell injection).
 */
async function resolvePackageManager(cwd: string): Promise<{ cmd: string; label: string }> {
  let pm = 'npm';
  if ((await fileExists(join(cwd, 'bun.lock'))) || (await fileExists(join(cwd, 'bun.lockb')))) pm = 'bun';
  else if (await fileExists(join(cwd, 'pnpm-lock.yaml'))) pm = 'pnpm';
  else if (await fileExists(join(cwd, 'yarn.lock'))) pm = 'yarn';
  const cmd = process.platform === 'win32' && pm !== 'bun' ? `${pm}.cmd` : pm;
  return { cmd, label: pm };
}

/**
 * Run an npm script (`<pm> run <script>`) inside a local checkout, streaming its
 * output. The package manager is auto-detected from the lockfile; the script
 * must exist in package.json (checked first so a typo fails clean, not mid-run).
 *
 * ponytail: output is buffered, not live-streamed — a long build shows nothing
 * until it finishes. Upgrade to `spawn` + piped stdout if live logs are needed.
 */
export async function buildLocal(
  params: { cwd: string; script: string },
  onLog: LogFn
): Promise<{ ok: boolean; error?: string }> {
  const cwd = params.cwd?.trim();
  const script = params.script?.trim();
  if (!cwd) return { ok: false, error: 'No repository folder selected.' };
  if (!script || !BUILD_SCRIPT.test(script)) return { ok: false, error: 'Invalid build script name.' };

  try {
    const dir = await stat(cwd).catch((): null => null);
    if (!dir || !dir.isDirectory()) return { ok: false, error: 'That folder does not exist.' };

    let pkg: { scripts?: Record<string, string> };
    try {
      pkg = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'));
    } catch {
      return { ok: false, error: 'No package.json in that folder.' };
    }
    if (!pkg.scripts?.[script]) {
      return { ok: false, error: `No "${script}" script in package.json.` };
    }

    const { cmd, label } = await resolvePackageManager(cwd);
    onLog(`Building ${cwd} — ${label} run ${script} (this can take several minutes)…`);
    await step(onLog, `${label} run ${script}`, cmd, ['run', script], { cwd, timeoutMs: BUILD_TIMEOUT_MS });
    onLog('Local build finished.');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof DevActionError ? e.message : scrubSecrets(String(e)) };
  }
}

type JsonObject = Record<string, unknown>;

function parseJson(text: string, label: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new DevActionError(`${label}: GitHub returned invalid JSON.`);
  }
}

function asObject(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new DevActionError(`${label}: GitHub returned an unexpected response.`);
  }
  return value as JsonObject;
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new DevActionError(`${label}: GitHub omitted required repository metadata.`);
  }
  return value.trim();
}

function requiredCount(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new DevActionError(`${label}: GitHub returned an invalid commit count.`);
  }
  return value;
}

function requiredBranch(value: unknown, label: string): string {
  const branch = requiredString(value, label);
  if (
    sanitizeBranch(branch) !== branch ||
    branch.includes('..') ||
    branch.includes('//') ||
    branch.startsWith('/') ||
    branch.endsWith('/')
  ) {
    throw new DevActionError(`${label}: GitHub returned an invalid branch name.`);
  }
  return branch;
}

async function ghApi(onLog: LogFn, label: string, args: string[]): Promise<unknown> {
  const response = await step(onLog, label, 'gh', ['api', ...args]);
  return parseJson(response.stdout, label);
}

/**
 * Prepare non-destructive upstream-sync PRs for fork repositories.
 *
 * The authenticated local `gh` user updates only {@link SYNC_BRANCH}; the
 * fork's default branch is never written here. That makes divergent fork-only
 * commits the PR base, where they remain visible and conflict-checkable.
 */
export async function syncForks(params: { repos: string[] }, onLog: LogFn): Promise<{ results: ForkSyncResult[] }> {
  const repos = [...new Set((params.repos || []).map((r) => r.trim()).filter(Boolean))];
  const results = await Promise.all(
    repos.map((repo): Promise<ForkSyncResult> => {
      if (!REPO_SLUG.test(repo)) {
        return Promise.resolve({ repo, ok: false, error: 'Invalid repository slug.' });
      }
      return syncFork(repo, onLog);
    })
  );
  return { results };
}

async function syncFork(repo: string, onLog: LogFn): Promise<ForkSyncResult> {
  try {
    const metadata = asObject(
      await ghApi(onLog, `Read fork metadata for ${repo}`, [
        `repos/${repo}`,
        '--jq',
        '{fork,owner:.owner.login,targetBranch:.default_branch,upstream:.source.full_name,upstreamOwner:.source.owner.login,upstreamBranch:.source.default_branch}',
      ]),
      repo
    );
    if (metadata.fork !== true) throw new DevActionError(`${repo} is not a fork.`);

    const owner = requiredString(metadata.owner, repo);
    const targetBranch = requiredBranch(metadata.targetBranch, repo);
    const upstream = requiredString(metadata.upstream, repo);
    const upstreamOwner = requiredString(metadata.upstreamOwner, repo);
    const upstreamBranch = requiredBranch(metadata.upstreamBranch, repo);
    if (!REPO_SLUG.test(upstream)) {
      throw new DevActionError(`${repo}: GitHub returned an invalid upstream repository.`);
    }

    const comparison = asObject(
      await ghApi(onLog, `Compare ${repo} with ${upstream}`, [
        `repos/${repo}/compare/${encodeURIComponent(targetBranch)}...${encodeURIComponent(
          `${upstreamOwner}:${upstreamBranch}`
        )}`,
        '--jq',
        '{ahead:.ahead_by,preserved:.behind_by}',
      ]),
      repo
    );
    const upstreamCommits = requiredCount(comparison.ahead, repo);
    const preservedForkCommits = requiredCount(comparison.preserved, repo);
    onLog(
      `${repo}: ${upstreamCommits} upstream commit(s) to import; ${preservedForkCommits} fork-only commit(s) remain on ${targetBranch}.`
    );

    if (upstreamCommits === 0) {
      onLog(`${repo} is already up to date with ${upstream}.`);
      return {
        repo,
        ok: true,
        status: 'up-to-date',
        upstream,
        upstreamCommits,
        preservedForkCommits,
      };
    }

    const upstreamRef = asObject(
      await ghApi(onLog, `Read ${upstreamBranch} head from ${upstream}`, [
        `repos/${upstream}/git/ref/heads/${upstreamBranch}`,
        '--jq',
        '{sha:.object.sha}',
      ]),
      upstream
    );
    const upstreamSha = requiredString(upstreamRef.sha, upstream);

    const matchingRefs = await ghApi(onLog, `Check ${SYNC_BRANCH} on ${repo}`, [
      `repos/${repo}/git/matching-refs/heads/${SYNC_BRANCH}`,
      '--jq',
      'map({ref,sha:.object.sha})',
    ]);
    if (!Array.isArray(matchingRefs)) {
      throw new DevActionError(`${repo}: GitHub returned an unexpected branch response.`);
    }
    const syncRef = `refs/heads/${SYNC_BRANCH}`;
    const branchExists = matchingRefs.some((candidate) => asObject(candidate, repo).ref === syncRef);

    if (branchExists) {
      await ghApi(onLog, `Update disposable sync branch on ${repo}`, [
        `repos/${repo}/git/refs/heads/${SYNC_BRANCH}`,
        '--method',
        'PATCH',
        '-f',
        `sha=${upstreamSha}`,
        '-F',
        'force=true',
      ]);
    } else {
      await ghApi(onLog, `Create disposable sync branch on ${repo}`, [
        `repos/${repo}/git/refs`,
        '--method',
        'POST',
        '-f',
        `ref=refs/heads/${SYNC_BRANCH}`,
        '-f',
        `sha=${upstreamSha}`,
      ]);
    }

    const pulls = await ghApi(onLog, `Find existing upstream sync PR on ${repo}`, [
      `repos/${repo}/pulls`,
      '--method',
      'GET',
      '-f',
      'state=open',
      '-f',
      `head=${owner}:${SYNC_BRANCH}`,
      '-f',
      `base=${targetBranch}`,
      '--jq',
      'map({url:.html_url})',
    ]);
    if (!Array.isArray(pulls)) {
      throw new DevActionError(`${repo}: GitHub returned an unexpected pull request response.`);
    }

    const existingPull = pulls.length > 0 ? asObject(pulls[0], repo) : undefined;
    let prUrl = existingPull ? requiredString(existingPull.url, repo) : undefined;
    if (!prUrl) {
      const createdPull = asObject(
        await ghApi(onLog, `Open upstream sync PR on ${repo}`, [
          `repos/${repo}/pulls`,
          '--method',
          'POST',
          '-f',
          `title=chore: sync fork from ${upstream}`,
          '-f',
          `head=${owner}:${SYNC_BRANCH}`,
          '-f',
          `base=${targetBranch}`,
          '-f',
          `body=Brings ${upstreamCommits} upstream commit(s) from ${upstream}@${upstreamBranch} into this fork through a reviewable PR. The ${preservedForkCommits} fork-only commit(s) on ${targetBranch} are retained.`,
          '--jq',
          '{url:.html_url}',
        ]),
        repo
      );
      prUrl = requiredString(createdPull.url, repo);
    }

    onLog(`Sync PR ready for ${repo}: ${prUrl}`);
    return {
      repo,
      ok: true,
      status: branchExists ? 'updated' : 'created',
      prUrl,
      upstream,
      upstreamCommits,
      preservedForkCommits,
    };
  } catch (e) {
    const error = e instanceof DevActionError ? e.message : scrubSecrets(String(e));
    onLog(`${repo}: ${error}`);
    return { repo, ok: false, error };
  }
}

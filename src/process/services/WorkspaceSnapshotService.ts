/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 * Modified by Ferrox Labs in 2026. Changes are documented in the project history.
 */

import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { CompareResult, FileChangeInfo, SnapshotInfo } from '@/common/types/fileSnapshot';
import { getSystemDir } from '@process/utils/initStorage';

const execFileAsync = promisify(execFile);

const SNAPSHOT_DIRNAME = '.wayland-snapshots';
const SNAPSHOT_PREFIX = 'wayland-snapshot-';
const SNAPSHOT_OWNER_FILE = '.wayland-snapshot-owner.json';
const SNAPSHOT_OWNER = Object.freeze({ kind: 'wayland-workspace-snapshot', version: 1 });

type MoveToTrash = (entryPath: string) => Promise<void>;

async function moveToSystemTrash(entryPath: string): Promise<void> {
  const electron = await import('electron');
  if (!electron.shell?.trashItem) throw new Error('RECOVERABLE_TRASH_UNAVAILABLE');
  await electron.shell.trashItem(entryPath);
}

/**
 * Resolve the root directory under which transient snapshot gitdirs live.
 *
 * Prefers `<workDir>/.wayland-snapshots` so snapshots land on the same drive
 * as the user-configured workspace (avoids filling the system drive on
 * Windows setups where C: is system and D: is workspace - upstream #2679).
 * Falls back to `os.tmpdir()` when the workDir lookup throws (e.g. before
 * storage init, or in tests with no Electron app path).
 */
function getSnapshotRoot(): string {
  try {
    const workDir = getSystemDir().workDir;
    if (workDir) {
      return path.join(workDir, SNAPSHOT_DIRNAME);
    }
  } catch {
    // initStorage not ready or unavailable - fall through to tmpdir
  }
  return os.tmpdir();
}

type SnapshotState = {
  mode: 'git-repo' | 'snapshot';
  workspacePath: string;
  gitdir: string;
  baselineRef: string;
  branch: string | null;
};

const DEFAULT_GITIGNORE = `node_modules/
.git/
*.lock
dist/
build/
out/
target/
.next/
.nuxt/
.output/
.cache/
.parcel-cache/
.tsbuildinfo
__pycache__/
.venv/
venv/
*.pyc
`;

export class WorkspaceSnapshotService {
  private snapshots = new Map<string, SnapshotState>();

  constructor(private readonly moveToTrash: MoveToTrash = moveToSystemTrash) {}

  async init(workspacePath: string): Promise<SnapshotInfo> {
    if (this.snapshots.has(workspacePath)) {
      await this.dispose(workspacePath);
    }

    // Verify workspace directory exists before attempting snapshot.
    // Temp directories (claude-temp-*, .gemini, etc.) may be deleted before init runs.
    try {
      const stat = await fs.stat(workspacePath);
      if (!stat.isDirectory()) {
        return { mode: 'snapshot', branch: null };
      }
    } catch {
      return { mode: 'snapshot', branch: null };
    }

    const mode = await this.detectMode(workspacePath);

    if (mode === 'git-repo') {
      return this.initGitRepo(workspacePath);
    }
    return this.initSnapshot(workspacePath);
  }

  async compare(workspacePath: string): Promise<CompareResult> {
    return this.computeCompare(workspacePath);
  }

  private async computeCompare(workspacePath: string): Promise<CompareResult> {
    const state = this.snapshots.get(workspacePath);
    if (!state) {
      return { staged: [], unstaged: [] };
    }

    if (state.mode === 'git-repo') {
      return this.compareGitRepo(workspacePath);
    }
    return this.compareSnapshot(state);
  }

  async getBaselineContent(workspacePath: string, filePath: string): Promise<string | null> {
    const state = this.snapshots.get(workspacePath);
    if (!state) {
      return null;
    }

    try {
      const gitArgs = state.mode === 'git-repo' ? [] : this.gitArgs(state);
      const { stdout } = await execFileAsync('git', [...gitArgs, 'show', `HEAD:${filePath}`], {
        cwd: workspacePath,
        maxBuffer: 50 * 1024 * 1024,
        encoding: 'utf-8',
      });
      return stdout;
    } catch {
      return null;
    }
  }

  async getInfo(workspacePath: string): Promise<SnapshotInfo> {
    const state = this.snapshots.get(workspacePath);
    if (!state) {
      return { mode: 'snapshot', branch: null };
    }
    return { mode: state.mode, branch: state.branch };
  }

  // --- Branch operations (git-repo mode only) ---

  async getBranches(workspacePath: string): Promise<string[]> {
    const state = this.snapshots.get(workspacePath);
    if (!state || state.mode !== 'git-repo') {
      return [];
    }
    const { stdout } = await execFileAsync('git', ['branch', '--format=%(refname:short)'], { cwd: workspacePath });
    return stdout
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);
  }

  // --- Git operations (git-repo mode only) ---

  async stageFile(workspacePath: string, filePath: string): Promise<void> {
    this.ensureGitRepo(workspacePath);
    await execFileAsync('git', ['add', '--', filePath], { cwd: workspacePath });
  }

  async stageAll(workspacePath: string): Promise<void> {
    this.ensureGitRepo(workspacePath);
    await execFileAsync('git', ['add', '-A'], { cwd: workspacePath, maxBuffer: 10 * 1024 * 1024 });
  }

  async unstageFile(workspacePath: string, filePath: string): Promise<void> {
    this.ensureGitRepo(workspacePath);
    await execFileAsync('git', ['restore', '--staged', '--', filePath], { cwd: workspacePath });
  }

  async unstageAll(workspacePath: string): Promise<void> {
    this.ensureGitRepo(workspacePath);
    await execFileAsync('git', ['restore', '--staged', '.'], { cwd: workspacePath });
  }

  async discardFile(workspacePath: string, filePath: string, operation: FileChangeInfo['operation']): Promise<void> {
    this.ensureGitRepo(workspacePath);
    const fullPath = await this.resolveWorkspaceEntry(workspacePath, filePath);

    if (operation === 'create') {
      // Untracked work remains recoverable through operating-system Trash.
      await this.moveExistingEntryToTrash(fullPath);
    } else {
      // Preserve the current modified bytes before restoring the baseline.
      if (operation === 'modify') await this.moveExistingEntryToTrash(fullPath);
      await execFileAsync('git', ['checkout', 'HEAD', '--', filePath], { cwd: workspacePath });
    }
  }

  // --- Snapshot mode reset ---

  async resetFile(workspacePath: string, filePath: string, operation: FileChangeInfo['operation']): Promise<void> {
    const state = this.snapshots.get(workspacePath);
    if (!state || state.mode !== 'snapshot') return;

    const fullPath = await this.resolveWorkspaceEntry(workspacePath, filePath);

    if (operation === 'create') {
      await this.moveExistingEntryToTrash(fullPath);
    } else {
      const content = await this.getBaselineContent(workspacePath, filePath);
      if (content !== null) {
        if (operation === 'modify') await this.moveExistingEntryToTrash(fullPath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true }).catch(() => {});
        await fs.writeFile(fullPath, content, 'utf-8');
      }
    }
  }

  // --- Lifecycle ---

  async dispose(workspacePath: string): Promise<void> {
    const state = this.snapshots.get(workspacePath);
    if (!state) {
      return;
    }

    // Only snapshot mode uses a temp gitdir that needs cleanup
    if (state.mode === 'snapshot') {
      await fs.rm(state.gitdir, { recursive: true, force: true }).catch(() => {});
    }

    this.snapshots.delete(workspacePath);
  }

  async disposeAll(): Promise<void> {
    const workspaces = Array.from(this.snapshots.keys());
    await Promise.all(workspaces.map((ws) => this.dispose(ws)));
  }

  /**
   * Remove leftover `wayland-snapshot-*` directories from previous sessions
   * that were not cleaned up (e.g. due to a crash). Safe to call at startup
   * as a fire-and-forget - errors are silently ignored.
   *
   * Scans both the current snapshot root (under workDir) AND `os.tmpdir()`
   * to clean up legacy entries left behind before snapshots respected
   * `workDir` (upstream #2679 fix).
   */
  static async cleanupStaleSnapshots(rootOverride?: readonly string[]): Promise<void> {
    const roots = new Set<string>(rootOverride);
    if (!rootOverride) {
      roots.add(getSnapshotRoot());
      // Always scan tmpdir too - covers legacy snapshots from pre-fix builds.
      roots.add(os.tmpdir());
    }

    await Promise.all(
      Array.from(roots).map(async (root) => {
        let entries: string[];
        try {
          entries = await fs.readdir(root);
        } catch {
          return;
        }
        const candidates = entries.filter((name) => name.startsWith(SNAPSHOT_PREFIX));
        const owned = await Promise.all(
          candidates.map(async (name): Promise<string | null> => {
            const candidate = path.join(root, name);
            try {
              const stat = await fs.lstat(candidate);
              if (!stat.isDirectory() || stat.isSymbolicLink()) return null;
              const marker = JSON.parse(await fs.readFile(path.join(candidate, SNAPSHOT_OWNER_FILE), 'utf-8')) as {
                kind?: unknown;
                version?: unknown;
              };
              return marker.kind === SNAPSHOT_OWNER.kind && marker.version === SNAPSHOT_OWNER.version
                ? candidate
                : null;
            } catch {
              return null;
            }
          })
        );
        await Promise.allSettled(
          owned
            .filter((candidate): candidate is string => candidate !== null)
            .map((candidate) =>
              fs.rm(candidate, {
                recursive: true,
                force: true,
              })
            )
        );
      })
    );
  }

  // --- Private ---

  private gitArgs(state: SnapshotState): string[] {
    return [`--git-dir=${state.gitdir}`, `--work-tree=${state.workspacePath}`];
  }

  private ensureGitRepo(workspacePath: string): void {
    const state = this.snapshots.get(workspacePath);
    if (!state || state.mode !== 'git-repo') {
      throw new Error('Git operations are only available in git-repo mode');
    }
  }

  /**
   * Resolve a renderer-supplied relative path inside the real workspace. Both
   * lexical traversal and symlinked ancestors that escape the workspace fail
   * closed before any mutation occurs.
   */
  private async resolveWorkspaceEntry(workspacePath: string, filePath: string): Promise<string> {
    const workspaceRoot = await fs.realpath(workspacePath);
    const candidate = path.resolve(workspaceRoot, filePath);
    const relative = path.relative(workspaceRoot, candidate);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error('WORKSPACE_ENTRY_OUTSIDE_ROOT');
    }

    await this.assertExistingAncestorWithinWorkspace(workspaceRoot, candidate);

    return candidate;
  }

  private async assertExistingAncestorWithinWorkspace(workspaceRoot: string, entryPath: string): Promise<void> {
    try {
      const realExisting = await fs.realpath(entryPath);
      const realRelative = path.relative(workspaceRoot, realExisting);
      if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) {
        throw new Error('WORKSPACE_ENTRY_OUTSIDE_ROOT');
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const parent = path.dirname(entryPath);
      if (parent === entryPath) throw error;
      await this.assertExistingAncestorWithinWorkspace(workspaceRoot, parent);
    }
  }

  private async moveExistingEntryToTrash(entryPath: string): Promise<void> {
    try {
      await fs.lstat(entryPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
    await this.moveToTrash(entryPath);
  }

  private async detectMode(workspacePath: string): Promise<'git-repo' | 'snapshot'> {
    try {
      await execFileAsync('git', ['rev-parse', '--git-dir'], { cwd: workspacePath });
      return 'git-repo';
    } catch {
      return 'snapshot';
    }
  }

  private async initGitRepo(workspacePath: string): Promise<SnapshotInfo> {
    const gitdir = path.join(workspacePath, '.git');

    let branch: string | null = null;
    try {
      const { stdout } = await execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: workspacePath });
      branch = stdout.trim() || null;
    } catch {
      // Detached HEAD or empty repo
    }

    let baselineRef = 'HEAD';
    try {
      const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: workspacePath });
      baselineRef = stdout.trim();
    } catch {
      // Empty repo with no commits
    }

    this.snapshots.set(workspacePath, {
      mode: 'git-repo',
      workspacePath,
      gitdir,
      baselineRef,
      branch,
    });

    return { mode: 'git-repo', branch };
  }

  private async initSnapshot(workspacePath: string): Promise<SnapshotInfo> {
    let gitdir: string | undefined;
    try {
      gitdir = await this.createWorkingTreeSnapshot(workspacePath);
    } catch {
      // Workspace may have been removed during snapshot creation - clean up and bail
      return { mode: 'snapshot', branch: null };
    }

    let baselineRef: string;
    try {
      const { stdout: oidOut } = await execFileAsync(
        'git',
        [`--git-dir=${gitdir}`, `--work-tree=${workspacePath}`, 'rev-parse', 'HEAD'],
        { cwd: workspacePath }
      );
      baselineRef = oidOut.trim();
    } catch {
      // Temp gitdir may have been cleaned up by OS or anti-virus - bail gracefully
      await fs.rm(gitdir, { recursive: true, force: true }).catch(() => {});
      return { mode: 'snapshot', branch: null };
    }

    this.snapshots.set(workspacePath, {
      mode: 'snapshot',
      workspacePath,
      gitdir,
      baselineRef,
      branch: null,
    });

    return { mode: 'snapshot', branch: null };
  }

  /** Parse `git status --porcelain` for git-repo mode → staged + unstaged */
  private async compareGitRepo(workspacePath: string): Promise<CompareResult> {
    // Flush stale index stat entries so that files whose only difference is
    // mtime (not content) are not reported as modified.  The `-q` flag
    // suppresses "needs update" messages; errors are ignored because the repo
    // may be in a state where this can't run (e.g. empty repo, locked index).
    await execFileAsync('git', ['update-index', '-q', '--refresh'], {
      cwd: workspacePath,
    }).catch(() => {});

    const { stdout } = await execFileAsync('git', ['status', '--porcelain'], {
      cwd: workspacePath,
      maxBuffer: 10 * 1024 * 1024,
    });

    // A file whose only difference is the executable/mode bit (e.g. a `chmod`
    // after extraction or a cross-filesystem checkout) shows up as `M` in
    // porcelain but has zero added/removed lines.  Surfacing it in the Changes
    // panel as a +0/-0 "modified" file is noise, so drop modify entries that
    // have no actual content diff.  Paths with real content changes (including
    // binary, which numstat reports as `-`) are kept.
    // When numstat returns null it could not run, so we keep every modify entry
    // rather than silently dropping real changes (`has` below is short-circuited).
    const stagedHasContent = await this.pathsWithContentDiff(workspacePath, true);
    const unstagedHasContent = await this.pathsWithContentDiff(workspacePath, false);

    const staged: FileChangeInfo[] = [];
    const unstaged: FileChangeInfo[] = [];

    for (const line of stdout.split('\n')) {
      if (!line) continue;

      const x = line[0]; // staging area status
      const y = line[1]; // working tree status
      const filepath = line.slice(3);

      const makeInfo = (op: FileChangeInfo['operation']): FileChangeInfo => ({
        relativePath: filepath,
        filePath: path.join(workspacePath, filepath),
        operation: op,
      });

      // Staged changes (X column)
      if (x === 'M') {
        if (stagedHasContent === null || stagedHasContent.has(filepath)) staged.push(makeInfo('modify'));
      } else if (x === 'A') staged.push(makeInfo('create'));
      else if (x === 'D') staged.push(makeInfo('delete'));
      else if (x === 'R') staged.push(makeInfo('modify'));

      // Unstaged changes (Y column)
      if (y === 'M') {
        if (unstagedHasContent === null || unstagedHasContent.has(filepath)) unstaged.push(makeInfo('modify'));
      } else if (y === 'D') unstaged.push(makeInfo('delete'));

      // Untracked files
      if (x === '?' && y === '?') unstaged.push(makeInfo('create'));
    }

    return { staged, unstaged };
  }

  /**
   * Build the set of relative paths that have an actual content diff. `git diff
   * --numstat` prints `<added>\t<removed>\t<path>`; a mode-only change is `0 0`,
   * while binary files are `-`. We keep anything that is not literally `0 0`.
   * `cached` selects staged (index vs HEAD) vs working-tree (vs index).
   * Returns `null` if numstat could not run, so callers keep all entries.
   */
  private async pathsWithContentDiff(workspacePath: string, cached: boolean): Promise<Set<string> | null> {
    const result = new Set<string>();
    const args = ['diff', '--numstat'];
    if (cached) args.splice(1, 0, '--cached');

    try {
      const { stdout } = await execFileAsync('git', args, {
        cwd: workspacePath,
        maxBuffer: 10 * 1024 * 1024,
      });
      for (const line of stdout.split('\n')) {
        if (!line) continue;
        const [added, removed, ...rest] = line.split('\t');
        const filepath = rest.join('\t');
        if (!filepath) continue;
        // `-` marks binary (real change); only `0`/`0` is a no-content modify.
        if (added === '0' && removed === '0') continue;
        result.add(filepath);
      }
    } catch {
      // If numstat can't run, fall back to trusting porcelain (keep all).
      return null;
    }

    return result;
  }

  /** Compare snapshot mode - all changes go to unstaged (no staging concept) */
  private async compareSnapshot(state: SnapshotState): Promise<CompareResult> {
    const gitArgs = this.gitArgs(state);
    const changes: FileChangeInfo[] = [];

    const { stdout: diffOut } = await execFileAsync('git', [...gitArgs, 'diff', '--name-status', state.baselineRef], {
      cwd: state.workspacePath,
      maxBuffer: 10 * 1024 * 1024,
    });

    for (const line of diffOut.split('\n')) {
      if (!line) continue;
      const status = line[0];
      const filepath = line.slice(2);
      if (status === 'M') {
        changes.push({
          relativePath: filepath,
          filePath: path.join(state.workspacePath, filepath),
          operation: 'modify',
        });
      } else if (status === 'D') {
        changes.push({
          relativePath: filepath,
          filePath: path.join(state.workspacePath, filepath),
          operation: 'delete',
        });
      } else if (status === 'A') {
        changes.push({
          relativePath: filepath,
          filePath: path.join(state.workspacePath, filepath),
          operation: 'create',
        });
      }
    }

    const { stdout: untrackedOut } = await execFileAsync(
      'git',
      [...gitArgs, 'ls-files', '--others', '--exclude-standard'],
      { cwd: state.workspacePath, maxBuffer: 10 * 1024 * 1024 }
    );

    for (const filepath of untrackedOut.split('\n')) {
      if (!filepath) continue;
      changes.push({ relativePath: filepath, filePath: path.join(state.workspacePath, filepath), operation: 'create' });
    }

    return { staged: [], unstaged: changes };
  }

  private async createWorkingTreeSnapshot(workspacePath: string): Promise<string> {
    const root = getSnapshotRoot();
    // Ensure the snapshot root exists when it's not os.tmpdir() (which is
    // always present). `recursive: true` is a no-op when the dir already exists.
    await fs.mkdir(root, { recursive: true }).catch(() => {});
    const gitdir = path.join(root, `${SNAPSHOT_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    const gitArgs = [`--git-dir=${gitdir}`, `--work-tree=${workspacePath}`];

    await execFileAsync('git', ['init', '--bare', gitdir]);
    await fs.writeFile(path.join(gitdir, SNAPSHOT_OWNER_FILE), JSON.stringify(SNAPSHOT_OWNER), 'utf-8');
    await fs.writeFile(path.join(gitdir, 'info', 'exclude'), DEFAULT_GITIGNORE, 'utf-8');
    // Use --ignore-errors so locked/permission-denied files don't abort the entire snapshot.
    // The command still exits non-zero when some files fail, so catch and verify the commit succeeds.
    try {
      await execFileAsync('git', [...gitArgs, 'add', '--ignore-errors', '.'], {
        cwd: workspacePath,
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch (error) {
      const stderr = (error as { stderr?: string }).stderr ?? '';
      // Re-throw if the error is NOT a partial indexing failure (e.g. git not found)
      if (!stderr.includes('Permission denied') && !stderr.includes('unable to index file')) {
        throw error;
      }
    }
    await execFileAsync(
      'git',
      [
        ...gitArgs,
        '-c',
        'user.name=Wayland',
        '-c',
        'user.email=snapshot@wayland.local',
        'commit',
        '--allow-empty',
        '-m',
        'baseline',
      ],
      { cwd: workspacePath, maxBuffer: 10 * 1024 * 1024 }
    );

    return gitdir;
  }
}

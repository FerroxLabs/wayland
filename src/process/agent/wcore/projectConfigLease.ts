import { realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// Must match the engine's project-config filename (see index.ts). The engine
// loads `.wayland-core.toml` from its cwd, so the lease that serializes the
// temporary write window keys on that exact path.
const WCORE_PROJECT_CONFIG = '.wayland-core.toml';
const leaseTails = new Map<string, Promise<void>>();

/**
 * Serialize the temporary project-config window for Core launches sharing a
 * workspace. The lease must cover write -> Core ready -> restore; serializing
 * only the filesystem write still lets a sibling replace the bytes before the
 * first Core process reads them.
 */
export async function withWCoreProjectConfigLease<T>(
  workspace: string,
  task: (canonicalWorkspace: string) => Promise<T>
): Promise<T> {
  // Canonicalize the physical workspace, not just its lexical spelling. Two
  // symlink aliases to one project must share the same authority lease. Pass
  // that exact captured path into the protected operation as well: continuing
  // to use the lexical alias after locking would let a symlink retarget move the
  // config write and child cwd outside the authority we actually leased.
  const canonicalWorkspace = await realpath(workspace);
  const key = join(canonicalWorkspace, WCORE_PROJECT_CONFIG);
  const predecessor = leaseTails.get(key) ?? Promise.resolve();
  let release!: () => void;
  const held = new Promise<void>((resolveHeld) => {
    release = resolveHeld;
  });
  const tail = predecessor.catch((): void => {}).then(() => held);
  leaseTails.set(key, tail);

  await predecessor.catch((): void => {});
  try {
    return await task(canonicalWorkspace);
  } finally {
    release();
    if (leaseTails.get(key) === tail) {
      void tail.finally(() => {
        if (leaseTails.get(key) === tail) leaseTails.delete(key);
      });
    }
  }
}

// K-01: a SEPARATE keyed promise-tail map from `leaseTails` above. Own `Map`
// on purpose (never shared with the workspace lease) so the two keyspaces
// stay structurally distinct even though a collision between a workspace
// `.wayland-core.toml` path and a global `config.toml` path is not
// realistically possible.
const globalProfileLeaseTails = new Map<string, Promise<void>>();

/**
 * Serialize the global-config write window (write -> Core ready -> restore)
 * for Core launches sharing a resolved config directory.
 *
 * Keyed on the resolved config PATH (`join(configDir, 'config.toml')`), not
 * the bare directory - the SAME identity `resolveActiveConfigPath()` /
 * `configMcpServers.ts` already treat as the file. Every `@native` launch
 * shares this exact key (hotter than the per-workspace lease above); a named
 * profile's launches key on that profile's own path and never contend with
 * `@native` traffic - the key alone gives the correct scope, no
 * profile-identity branching needed here.
 *
 * Deliberately independent of `withProfileAuthorityLock` (`profilePaths.ts`):
 * that queue is a single, global, non-reentrant FIFO used for brief
 * marker/ref-count mutations. Holding it across an entire splice-write ->
 * Core-ready -> restore window would serialize every OTHER chat's unrelated
 * profile-authority call behind this one, and could self-deadlock if any
 * code on that path re-enters it (e.g. a process-exit handler releasing a
 * retained profile). This lease is never called, wrapped, or nested inside
 * that lock.
 */
export async function withGlobalWCoreProfileLease<T>(
  configDir: string,
  task: (canonicalConfigDir: string) => Promise<T>
): Promise<T> {
  // Canonicalize before deriving the key, exactly as `withWCoreProjectConfigLease`
  // does for the workspace. Two symlink aliases to ONE physical config dir
  // (`~/.wayland-core -> ~/dotfiles/wayland-core` is an ordinary dotfiles
  // pattern) must share one lease, or two launches interleave
  // `ProjectConfigTransaction` on the same file: B reads A's spliced content as
  // if it were the original, backs THAT up, and its restore bakes A's temporary
  // profile permanently into the user's real hand-edited config. A's own
  // restore then no-ops, because the on-disk bytes no longer hash to what it
  // wrote - the "user edit wins" rule misfiring on a write Desktop itself made.
  //
  // The canonical directory is passed into the task so the lease key and the
  // actual write target can never diverge - the same discipline the workspace
  // lease applies by handing back `canonicalWorkspace`.
  //
  // A config dir that does not exist yet (first launch on a clean machine)
  // cannot be realpath'd; fall back to lexical resolution, which is still
  // strictly better than the raw string because it normalizes `.`, `..` and
  // trailing separators.
  let canonicalConfigDir: string;
  try {
    canonicalConfigDir = await realpath(configDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    canonicalConfigDir = resolve(configDir);
  }
  const key = join(canonicalConfigDir, 'config.toml');
  const predecessor = globalProfileLeaseTails.get(key) ?? Promise.resolve();
  let release!: () => void;
  const held = new Promise<void>((resolveHeld) => {
    release = resolveHeld;
  });
  const tail = predecessor.catch((): void => {}).then(() => held);
  globalProfileLeaseTails.set(key, tail);

  await predecessor.catch((): void => {});
  try {
    return await task(canonicalConfigDir);
  } finally {
    release();
    if (globalProfileLeaseTails.get(key) === tail) {
      void tail.finally(() => {
        if (globalProfileLeaseTails.get(key) === tail) globalProfileLeaseTails.delete(key);
      });
    }
  }
}

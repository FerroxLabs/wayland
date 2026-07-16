import { realpath } from 'node:fs/promises';
import { join } from 'node:path';

const WCORE_PROJECT_CONFIG = '.wcore.toml';
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

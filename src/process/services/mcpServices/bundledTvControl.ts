import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import authority from '../../../../scripts/tvcontrol/authority.json';

export const TVCONTROL_VERSION = authority.version;
export const TVCONTROL_CATALOG_ID = 'com.ferroxlabs/tvcontrol';
const MANAGED_TVCONTROL_VERSIONS = new Set(['2.4.7', '2.4.8', '2.4.9', TVCONTROL_VERSION]);

/** Upgrade only known managed catalog declarations, preserving custom commands. */
export function isBundledTvControlDeclaration(
  command: string,
  args: readonly string[],
  libraryEntryId?: string
): boolean {
  const npxDeclaration = command === 'npx' && (args.length === 1 || (args.length === 2 && args[0] === '-y'));
  const legacyBunDeclaration =
    (command === 'bun' || command === 'bun.exe') && args.length === 3 && args[0] === 'x' && args[1] === '--bun';
  return (
    libraryEntryId === TVCONTROL_CATALOG_ID &&
    (npxDeclaration || legacyBunDeclaration) &&
    MANAGED_TVCONTROL_VERSIONS.has(args.at(-1)?.replace(/^@ferroxlabs\/tvcontrol@/, '') ?? '') &&
    args.at(-1)?.startsWith('@ferroxlabs/tvcontrol@') === true
  );
}

// Same byte contract as scripts/prepareTvControl.js. The authority is compiled
// into Desktop, not read from the mutable workspace alongside the connector.
export function verifyTvControlTree(root: string, expectedDigest = authority.treeSha256): boolean {
  try {
    const entries: [string, string][] = [];
    const visit = (dir: string, prefix: string): void => {
      if (!fs.lstatSync(dir).isDirectory()) throw new Error('Not a real directory');
      for (const name of fs.readdirSync(dir).sort()) {
        const file = path.join(dir, name);
        const rel = prefix ? `${prefix}/${name}` : name;
        const stat = fs.lstatSync(file);
        if (stat.isDirectory()) visit(file, rel);
        else if (stat.isFile()) entries.push([rel, createHash('sha256').update(fs.readFileSync(file)).digest('hex')]);
        else throw new Error('Non-regular connector entry');
      }
    };
    visit(path.join(root, 'node_modules'), '');
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/@ferroxlabs/tvcontrol/package.json'), 'utf8'));
    return (
      pkg.name === '@ferroxlabs/tvcontrol' &&
      pkg.version === TVCONTROL_VERSION &&
      createHash('sha256').update(JSON.stringify(entries)).digest('hex') === expectedDigest
    );
  } catch {
    return false;
  }
}

export function bundledTvControlRoot(): string {
  return path.join(
    app.isPackaged ? process.resourcesPath : path.join(app.getAppPath(), 'resources'),
    'bundled-tvcontrol'
  );
}

export function resolveBundledTvControlEntry(root = bundledTvControlRoot()): string {
  if (!verifyTvControlTree(root))
    throw new Error('Bundled TVControl 2.5.0 is missing or failed integrity verification');
  return path.join(root, 'node_modules/@ferroxlabs/tvcontrol/src/server.js');
}

/** Bun loads the managed server from a verified, application-owned user directory. */
export function resolveUserTvControlEntry(source = bundledTvControlRoot(), userData = app.getPath('userData')): string {
  resolveBundledTvControlEntry(source);
  let current = fs.realpathSync(userData);
  for (const part of ['mcp-runtimes', 'tvcontrol', authority.treeSha256]) {
    current = path.join(current, part);
    try {
      fs.mkdirSync(current);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
    if (!fs.lstatSync(current).isDirectory() || fs.realpathSync(current) !== current)
      throw new Error('TVControl user runtime directory is redirected');
  }
  copyTvControlToTempRoot(current, source);
  return path.join(
    current,
    `bunx-wayland-tvcontrol-${TVCONTROL_VERSION}`,
    'node_modules/@ferroxlabs/tvcontrol/src/server.js'
  );
}

/**
 * The collector already discovers bunx packages under TMPDIR. Give this session
 * its own real temp directory and a verified package there; no external grant,
 * HOME change, symlink, global install, or executable skill-tree copy is needed.
 */
export function provisionWorkspaceTvControl(workspace: string, source = bundledTvControlRoot()): string {
  resolveBundledTvControlEntry(source);
  const canonicalWorkspace = fs.realpathSync(workspace);
  let current = canonicalWorkspace;
  for (const part of ['.wayland-runtime', 'tmp']) {
    current = path.join(current, part);
    try {
      fs.mkdirSync(current);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
    if (!fs.lstatSync(current).isDirectory() || fs.realpathSync(current) !== current) {
      throw new Error('TVControl workspace runtime must remain inside the workspace');
    }
  }
  copyTvControlToTempRoot(current, source);
  return current;
}

function copyTvControlToTempRoot(current: string, source: string): void {
  const target = path.join(current, `bunx-wayland-tvcontrol-${TVCONTROL_VERSION}`);
  if (fs.existsSync(target)) {
    if (!fs.lstatSync(target).isDirectory() || !verifyTvControlTree(target))
      throw new Error('Existing workspace TVControl failed integrity verification');
    return;
  }
  const staging = path.join(current, `.tvcontrol-${randomUUID()}`);
  try {
    fs.mkdirSync(staging);
    fs.cpSync(path.join(source, 'node_modules'), path.join(staging, 'node_modules'), {
      recursive: true,
      dereference: false,
    });
    if (!verifyTvControlTree(staging)) throw new Error('Workspace TVControl copy failed integrity verification');
    fs.renameSync(staging, target);
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
}

/**
 * Core 0.13.12 (6e4eca07) redirects Bash's TMPDIR to its writable scratch
 * grant. The engine's inherited TMPDIR is only the parent of that directory.
 * Use the accepted policy receipt, never Core's private uid/trust path scheme.
 */
export function provisionTvControlForWorkspacePolicy(
  workspace: string,
  managedTempDir: string,
  writableRoots: readonly string[],
  source = bundledTvControlRoot()
): string {
  resolveBundledTvControlEntry(source);
  const canonicalWorkspace = fs.realpathSync(workspace);
  const expectedTemp = path.join(canonicalWorkspace, '.wayland-runtime', 'tmp');
  if (path.resolve(managedTempDir) !== expectedTemp)
    throw new Error('TVControl managed temp directory does not belong to this workspace');
  // Check every owned ancestor, including symlinks that resolve back inside.
  for (const dir of [path.dirname(expectedTemp), expectedTemp]) {
    if (!fs.lstatSync(dir).isDirectory() || fs.realpathSync(dir) !== dir)
      throw new Error('TVControl managed temp directory is redirected');
  }
  const candidates = [...new Set(writableRoots)].filter((root) => {
    if (!path.isAbsolute(root)) return false;
    const relative = path.relative(expectedTemp, root);
    return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  });
  if (candidates.length !== 1)
    throw new Error('TVControl requires exactly one workspace-contained scratch directory from Core');
  const scratch = path.resolve(candidates[0]);
  let current = expectedTemp;
  for (const part of path.relative(expectedTemp, scratch).split(path.sep)) {
    current = path.join(current, part);
    if (!fs.lstatSync(current).isDirectory() || fs.realpathSync(current) !== current)
      throw new Error('TVControl Core scratch directory is redirected');
  }
  copyTvControlToTempRoot(scratch, source);
  return scratch;
}

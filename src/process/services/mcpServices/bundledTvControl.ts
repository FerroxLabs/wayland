import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import authority from '../../../../scripts/tvcontrol/authority.json';

export const TVCONTROL_VERSION = authority.version;
export const TVCONTROL_CATALOG_ID = 'com.ferroxlabs/tvcontrol';

/** Only the catalog's exact managed declaration is eligible for replacement. */
export function isBundledTvControlDeclaration(
  command: string,
  args: readonly string[],
  libraryEntryId?: string
): boolean {
  return (
    libraryEntryId === TVCONTROL_CATALOG_ID &&
    command === 'npx' &&
    (args.length === 1 || (args.length === 2 && args[0] === '-y')) &&
    args.at(-1) === `@ferroxlabs/tvcontrol@${TVCONTROL_VERSION}`
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
    throw new Error('Bundled TVControl 2.4.7 is missing or failed integrity verification');
  return path.join(root, 'node_modules/@ferroxlabs/tvcontrol/src/server.js');
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
  const target = path.join(current, `bunx-wayland-tvcontrol-${TVCONTROL_VERSION}`);
  if (fs.existsSync(target)) {
    if (!fs.lstatSync(target).isDirectory() || !verifyTvControlTree(target))
      throw new Error('Existing workspace TVControl failed integrity verification');
    return current;
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
  return current;
}

import fs from 'node:fs';
import path from 'node:path';
import { digest, exactVersion } from './distribution.cjs';
const runtime = () => `${process.platform}-${process.arch}`;
const binaryName = () => (process.platform === 'win32' ? 'fuigo.exe' : 'fuigo');
function verified(dir: string): { path: string; version: string } | null {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'bundle.json'), 'utf8'));
    const file = path.join(dir, binaryName());
    if (
      manifest.contract !== 'fuigo-bundle/1.0' ||
      manifest.runtime !== runtime() ||
      manifest.binary !== binaryName() ||
      fs.lstatSync(file).isSymbolicLink()
    )
      return null;
    exactVersion(manifest.version);
    if (digest(fs.readFileSync(file)) !== manifest.stagedSha256) return null;
    return { path: file, version: manifest.version };
  } catch {
    return null;
  }
}
/** Packaged app resources first, then the dev tree. There is no userData
 *  override and no PATH fallback by design: only a receipt-verified bundle spawns. */
function bundleDirs(): string[] {
  const resources = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  return [
    ...(resources ? [path.join(resources, 'bundled-fuigo', runtime())] : []),
    path.join(process.cwd(), 'resources/bundled-fuigo', runtime()),
  ];
}
export function resolveFuigoBinary(dirs = bundleDirs()): { path: string; version: string } | null {
  for (const dir of dirs) {
    const ok = verified(dir);
    if (ok) return ok;
  }
  return null;
}
/**
 * What Settings → Agents shows for the engine. `verified` is exactly what
 * `resolveFuigoBinary` accepts; `unverified` is a staged binary the receipt
 * does not vouch for (absent, foreign runtime, or a digest mismatch) — it will
 * NOT spawn; `missing` is no binary at any bundle location. The version is the
 * receipt's (exact semver or nothing), never `--version` output.
 */
export type FuigoEngineStatus = { state: 'verified' | 'unverified' | 'missing'; version?: string; path?: string };
export function fuigoEngineStatus(dirs = bundleDirs()): FuigoEngineStatus {
  const ok = resolveFuigoBinary(dirs);
  if (ok) return { state: 'verified', ...ok };
  for (const dir of dirs) {
    const file = path.join(dir, binaryName());
    if (!fs.existsSync(file)) continue;
    let version: string | undefined;
    try {
      version = exactVersion(JSON.parse(fs.readFileSync(path.join(dir, 'bundle.json'), 'utf8')).version);
    } catch {
      /* receipt absent or malformed: no version to show */
    }
    return { state: 'unverified', path: file, version };
  }
  return { state: 'missing' };
}

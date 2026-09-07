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
export function resolveFuigoBinary(): { path: string; version: string } | null {
  const resources = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  return (
    (resources ? verified(path.join(resources, 'bundled-fuigo', runtime())) : null) ??
    verified(path.join(process.cwd(), 'resources/bundled-fuigo', runtime()))
  );
}

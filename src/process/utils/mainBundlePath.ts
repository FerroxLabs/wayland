/**
 * Resolve files emitted beside the Electron main entry.
 *
 * The compatibility bootstrap dynamically imports the stateful main module,
 * so Rollup may execute that module and its dependencies from out/main/chunks.
 * Worker entries and out/ siblings are still emitted relative to out/main.
 * Runtime code must therefore never assume its own __dirname is the main root.
 */
import path from 'node:path';

export function resolveMainBundleDirectory(fromDirectory: string = __dirname): string {
  const resolved = path.resolve(fromDirectory);
  return path.basename(resolved) === 'chunks' ? path.dirname(resolved) : resolved;
}

export function resolveMainBundlePath(relativePath: string, fromDirectory: string = __dirname): string {
  return path.resolve(resolveMainBundleDirectory(fromDirectory), relativePath);
}

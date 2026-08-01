import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveMainBundleDirectory, resolveMainBundlePath } from '@process/utils/mainBundlePath';

describe('main bundle path resolution', () => {
  it('uses an entry directory directly', () => {
    expect(resolveMainBundleDirectory('/app/out/main')).toBe(path.resolve('/app/out/main'));
  });

  it('normalizes a Rollup chunks directory back to the main entry directory', () => {
    expect(resolveMainBundleDirectory('/app/out/main/chunks')).toBe(path.resolve('/app/out/main'));
  });

  it('resolves worker entries beside the main entry from a chunk', () => {
    expect(resolveMainBundlePath('emailImap.js', '/app/out/main/chunks')).toBe(
      path.resolve('/app/out/main/emailImap.js')
    );
  });

  it('resolves preload and renderer siblings from a chunk', () => {
    expect(resolveMainBundlePath('../preload/index.js', '/app/out/main/chunks')).toBe(
      path.resolve('/app/out/preload/index.js')
    );
    expect(resolveMainBundlePath('../renderer/index.html', '/app/out/main/chunks')).toBe(
      path.resolve('/app/out/renderer/index.html')
    );
  });
});

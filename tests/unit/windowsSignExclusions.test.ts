import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { describe, expect, it } from 'vitest';

/**
 * Authenticode signing rewrites a binary. The third-party runtimes Desktop
 * bundles are verified against their pinned upstream release digests, so
 * re-signing them makes the packaged bytes differ from the bytes we downloaded
 * and attested, and verify-packaged-resources refuses the build.
 *
 * macOS expresses this through `mac.signIgnore`. Windows has no path filter, so
 * it is expressed as negative `signExts` patterns, which electron-builder
 * matches with `endsWith` against the full path.
 */
const readWinSignExts = (): string[] => {
  const config = parseYaml(fs.readFileSync(path.resolve('electron-builder.yml'), 'utf8')) as {
    win?: { signExts?: string[] };
  };
  return config.win?.signExts ?? [];
};

/** Mirrors app-builder-lib's WinPackager.shouldSignFile(file, true). */
const wouldSign = (file: string, signExts: string[]): boolean => {
  const backwardCompatibility = file.endsWith('.exe');
  if (!signExts.length) return backwardCompatibility || true;
  if (signExts.some((ext) => !ext.startsWith('!') && file.endsWith(ext))) return true;
  if (signExts.some((ext) => ext.startsWith('!') && file.endsWith(ext.substring(1)))) return false;
  return backwardCompatibility || true;
};

const UNPACKED = 'D:\\a\\wayland\\wayland\\out\\win-unpacked';

describe('windows signing exclusions', () => {
  it('leaves every digest-pinned bundled runtime unsigned', () => {
    const signExts = readWinSignExts();
    const pinned = [
      `${UNPACKED}\\resources\\bundled-bun\\win32-x64\\bun.exe`,
      // #1017: the AVX2-free baseline runtime for non-AVX2 win32-x64 CPUs is a
      // SEPARATE directory, so the win32-x64 exclusion above does not cover it
      // (electron-builder matches with endsWith against the full path).
      `${UNPACKED}\\resources\\bundled-bun\\win32-x64-baseline\\bun.exe`,
      `${UNPACKED}\\resources\\bundled-bun\\win32-arm64\\bun.exe`,
      `${UNPACKED}\\resources\\bundled-officecli\\win32-x64\\officecli.exe`,
      `${UNPACKED}\\resources\\bundled-officecli\\win32-arm64\\officecli.exe`,
      `${UNPACKED}\\resources\\bundled-wayland-core\\win32-x64\\wayland-core.exe`,
      `${UNPACKED}\\resources\\bundled-wayland-core\\win32-arm64\\wayland-core.exe`,
      `${UNPACKED}\\resources\\bundled-wayland-nano\\win32-x64\\wayland-nano.exe`,
    ];
    for (const file of pinned) {
      expect(wouldSign(file, signExts), `${file} must not be re-signed`).toBe(false);
    }
  });

  it('leaves the whatsapp-bridge shim executables unsigned so the source mirror still matches', () => {
    const signExts = readWinSignExts();
    const shims = [
      'browsers',
      'crc32',
      'escodegen',
      'esgenerate',
      'esparse',
      'esvalidate',
      'extract-zip',
      'glob',
      'js-yaml',
      'mime',
      'pino',
      'puppeteer',
      'qrcode-terminal',
      'semver',
      'which',
    ].map((name) => `${UNPACKED}\\resources\\whatsapp-bridge\\node_modules\\.bin\\${name}.exe`);
    shims.push(
      `${UNPACKED}\\resources\\whatsapp-bridge\\node_modules\\cross-spawn\\node_modules\\.bin\\node-which.exe`
    );
    for (const file of shims) {
      expect(wouldSign(file, signExts), `${file} must not be re-signed`).toBe(false);
    }
  });

  it('still signs the application, its installer and the helpers we ship as our own', () => {
    const signExts = readWinSignExts();
    const ours = [
      `${UNPACKED}\\Wayland.exe`,
      'D:\\a\\wayland\\wayland\\out\\Wayland-0.12.0-win-x64.exe',
      'D:\\a\\wayland\\wayland\\out\\Wayland-0.12.0-win-x64.__uninstaller.exe',
      `${UNPACKED}\\resources\\elevate.exe`,
      `${UNPACKED}\\resources\\app.asar.unpacked\\node_modules\\7zip-bin\\win\\x64\\7za.exe`,
      `${UNPACKED}\\resources\\app.asar.unpacked\\node_modules\\node-pty\\prebuilds\\win32-x64\\winpty-agent.exe`,
      `${UNPACKED}\\resources\\app.asar.unpacked\\node_modules\\node-pty\\prebuilds\\win32-x64\\conpty\\OpenConsole.exe`,
    ];
    for (const file of ours) {
      expect(wouldSign(file, signExts), `${file} must stay signed`).toBe(true);
    }
  });

  /**
   * The list above is hand-written, so it can only ever prove the shims someone
   * already thought of. It passed with and without the fix for run 33391945572,
   * where sharp 0.35.4 pulled a newer semver, gave @puppeteer/browsers its own
   * nested copy, and produced a shim at a path no entry matched. Signing rewrote
   * it from 15,872 to 31,624 bytes and the source-mirror gate refused the build
   * 30 minutes in.
   *
   * Enumerate what the frozen lockfile ACTUALLY installs instead, so the next
   * resolution change fails here rather than on a Windows runner.
   */
  const BRIDGE_MODULES = path.resolve('src', 'process', 'channels', 'whatsapp-bridge', 'node_modules');

  const installedShimPaths = (): string[] => {
    const files: string[] = [];
    const walk = (dir: string, relative: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === '.bin') {
          for (const shim of fs.readdirSync(path.join(dir, entry.name))) {
            // bun materialises each shim as `<name>.exe` on Windows.
            const bare = shim.replace(/\.(?:exe|cmd|ps1)$/i, '');
            files.push(`${UNPACKED}\\resources\\whatsapp-bridge${relative.replace(/\//g, '\\')}\\.bin\\${bare}.exe`);
          }
          continue;
        }
        if (entry.isDirectory()) walk(path.join(dir, entry.name), `${relative}/${entry.name}`);
      }
    };
    walk(BRIDGE_MODULES, '/node_modules');
    return [...new Set(files)].sort();
  };

  it('leaves EVERY shim the frozen lockfile installs unsigned, including nested ones', () => {
    // Asserted rather than skipped: postinstall installs the bridge, and a skip
    // would switch this check off on exactly the machines that package a build.
    expect(fs.existsSync(BRIDGE_MODULES), 'bridge node_modules missing - run postinstall').toBe(true);
    const shims = installedShimPaths();
    expect(shims.length).toBeGreaterThan(15);
    const signExts = readWinSignExts();
    expect(shims.filter((file) => wouldSign(file, signExts))).toEqual([]);
  });

  it('excludes by path rather than by extension, so unrelated executables are unaffected', () => {
    const signExts = readWinSignExts();
    expect(signExts.every((ext) => ext.startsWith('!'))).toBe(true);
    expect(wouldSign(`${UNPACKED}\\resources\\some-future-helper.exe`, signExts)).toBe(true);
  });
});

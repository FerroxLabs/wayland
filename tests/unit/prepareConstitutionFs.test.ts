import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const prepareConstitutionFs = require('../../scripts/prepareConstitutionFs.js') as (
  options: Record<string, unknown>
) => {
  supported: boolean;
  sha256?: string;
};

function fixture(): { root: string; outputRoot: string; generated: string; binary: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'constitution-prepare-'));
  const outputRoot = path.join(root, 'resources', 'bundled-constitution-fs');
  const generated = path.join(root, 'src', 'constitutionFsAuthority.generated.ts');
  const binary = path.join(root, 'native', 'constitution-fs', 'target', 'release', 'wayland-constitution-fs');
  fs.mkdirSync(path.dirname(binary), { recursive: true });
  fs.writeFileSync(path.join(root, 'native', 'constitution-fs', 'Cargo.toml'), '[package]\nname="fixture"\n');
  fs.writeFileSync(binary, 'verified-helper');
  return { root, outputRoot, generated, binary };
}

describe('prepareConstitutionFs', () => {
  it('generates target authority before Vite compiles app.asar and declares the helper as a packaged resource', () => {
    const build = fs.readFileSync(path.resolve('scripts/build-with-builder.js'), 'utf8');
    const builder = fs.readFileSync(path.resolve('electron-builder.yml'), 'utf8');
    expect(build.indexOf('prepareConstitutionFs({ platform:')).toBeGreaterThan(0);
    expect(build.indexOf('prepareConstitutionFs({ platform:')).toBeLessThan(build.indexOf('electron-vite build'));
    expect(builder).toContain('from: resources/bundled-constitution-fs');
    expect(builder).toContain("'/Contents/Resources/bundled-constitution-fs/[^/]+/wayland-constitution-fs$'");
  });

  it('fails closed for a foreign target and removes stale helper bytes', () => {
    const input = fixture();
    fs.mkdirSync(path.join(input.outputRoot, 'stale'), { recursive: true });
    fs.writeFileSync(path.join(input.outputRoot, 'stale', 'helper'), 'attacker');
    const result = prepareConstitutionFs({
      ...input,
      platform: 'win32',
      arch: process.arch,
    });
    expect(result.supported).toBe(false);
    expect(fs.existsSync(input.outputRoot)).toBe(false);
    expect(fs.readFileSync(input.generated, 'utf8')).toContain('"supported": false');
  });

  it.runIf(process.platform === 'darwin' || process.platform === 'linux')(
    'rejects cross-architecture packaging instead of silently disabling a supported target',
    () => {
      const input = fixture();
      expect(() =>
        prepareConstitutionFs({
          ...input,
          platform: process.platform,
          arch: process.arch === 'arm64' ? 'x64' : 'arm64',
        })
      ).toThrow('use an exact-target build runner');
      expect(fs.existsSync(input.outputRoot)).toBe(false);
    }
  );

  it.runIf(process.platform === 'darwin' || process.platform === 'linux')(
    'stages only the exact host runtime and compiles its digest authority',
    () => {
      const input = fixture();
      const execute = vi.fn(() => Buffer.alloc(0));
      const result = prepareConstitutionFs({
        ...input,
        platform: process.platform,
        arch: process.arch,
        execFileSync: execute,
      });
      const destination = path.join(input.outputRoot, `${process.platform}-${process.arch}`, 'wayland-constitution-fs');
      const expected = `sha256:${createHash('sha256').update('verified-helper').digest('hex')}`;
      expect(result).toMatchObject({ supported: true, sha256: expected });
      expect(fs.readFileSync(destination, 'utf8')).toBe('verified-helper');
      expect(fs.readFileSync(input.generated, 'utf8')).toContain(expected);
      expect(execute).toHaveBeenCalledWith(
        'cargo',
        expect.arrayContaining(['--locked', '--release']),
        expect.objectContaining({ cwd: input.root })
      );
    }
  );
});

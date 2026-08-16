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
    const prepareCall = build.indexOf('prepareConstitutionFs({');
    const platformBinding = build.indexOf('platform: packagePlatforms[0]', prepareCall);
    expect(prepareCall).toBeGreaterThan(0);
    expect(platformBinding).toBeGreaterThan(prepareCall);
    expect(prepareCall).toBeLessThan(build.indexOf('electron-vite build'));
    expect(builder).toContain('from: resources/bundled-constitution-fs');
    // The helper is ad-hoc signed upstream, so it must NOT be excluded from
    // signing: Apple rejects an app containing it unsigned. It is signed during
    // packaging and the packaged gate then requires our Developer ID on it.
    expect(builder).not.toContain("'/Contents/Resources/bundled-constitution-fs/[^/]+/wayland-constitution-fs$'");
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
    expect(fs.readFileSync(input.generated, 'utf8')).toContain('"protocolVersion": 2');
    expect(fs.readFileSync(input.generated, 'utf8')).toContain('// constitution-fs-authority-json:');
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
      expect(fs.readFileSync(input.generated, 'utf8')).toContain('"protocolVersion": 2');
      expect(fs.readFileSync(input.generated, 'utf8')).toContain('// constitution-fs-authority-json:');
      expect(
        JSON.parse(
          fs.readFileSync(path.join(input.outputRoot, `${process.platform}-${process.arch}`, 'manifest.json'), 'utf8')
        )
      ).toMatchObject({ schemaVersion: 1, protocolVersion: 2 });
      expect(execute).toHaveBeenCalledWith(
        'cargo',
        expect.arrayContaining(['--locked', '--release']),
        expect.objectContaining({ cwd: input.root })
      );
    }
  );

  it.runIf(process.platform === 'darwin' || process.platform === 'linux')(
    'binds an exact-target prebuilt helper without invoking a second compiler',
    () => {
      const input = fixture();
      const prebuiltBinary = path.join(input.root, 'docker-stage', 'wayland-constitution-fs');
      fs.mkdirSync(path.dirname(prebuiltBinary), { recursive: true });
      fs.writeFileSync(prebuiltBinary, 'docker-exact-helper');
      const execute = vi.fn();
      const result = prepareConstitutionFs({
        ...input,
        platform: process.platform,
        arch: process.arch,
        prebuiltBinary,
        execFileSync: execute,
      });
      const expected = `sha256:${createHash('sha256').update('docker-exact-helper').digest('hex')}`;
      expect(result).toMatchObject({ supported: true, sha256: expected });
      expect(execute).not.toHaveBeenCalledWith('cargo', expect.anything(), expect.anything());
      expect(fs.readFileSync(input.generated, 'utf8')).toContain(expected);
    }
  );

  it('builds and copies the digest-bound Linux helper into the standalone runtime image', () => {
    const dockerfile = fs.readFileSync(path.resolve('Dockerfile'), 'utf8');
    expect(dockerfile).toContain('FROM rust:1.94.0-slim AS constitution-builder');
    expect(dockerfile).toContain('cargo build --locked --release --manifest-path native/constitution-fs/Cargo.toml');
    expect(dockerfile).toContain('CONSTITUTION_FS_PREBUILT_BINARY=/tmp/wayland-constitution-fs');
    expect(dockerfile).toContain(
      'COPY --from=builder /app/resources/bundled-constitution-fs ./resources/bundled-constitution-fs'
    );
  });
});
